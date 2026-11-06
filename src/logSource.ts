import * as vscode from 'vscode';
import { LogSource } from './types';

/**
 * What kind of debug session produced the output. Decides how DAP categories map to sources:
 * - flutter: Flutter app launched by Dart-Code (flutter_tools DAP)
 * - dart: plain Dart program (DDS DAP)
 * - generic: any other debugger (Node, Python, ...)
 */
export type SessionProfile = 'flutter' | 'dart' | 'generic';

// Dart-Code's internal DebuggerType enum: Flutter = 2, FlutterTest = 3
const DART_CODE_FLUTTER_DEBUGGER_TYPES = [2, 3];

const ANSI_ESCAPE_REGEX = /\x1b\[[0-9;]*m/g;

// Android logcat prefix: I/flutter (12345): / D/EGL_emulation( 1234):
const LOGCAT_PREFIX_REGEX = /^([VDIWEF])\/([\w.-]+)\s*\(\s*\d+\s*\):\s*/;

// iOS/macOS device log prefix for Dart print() output
const FLUTTER_PRINT_PREFIX_REGEX = /^flutter:\s/;

// dart:developer log() output is sent by the DAP as "[loggerName] message" (category console)
const DEVELOPER_LOG_PREFIX_REGEX = /^\[[^\]\s:]+\]\s/;

// Flutter engine logs: [IMPORTANT:flutter/shell/...] / [ERROR:flutter/runtime/...]
const ENGINE_LOG_REGEX = /^\[(?:VERBOSE|INFO|IMPORTANT|WARNING|ERROR|FATAL):flutter\//;

// flutter_tools finished building and the app is being started: native device output may follow
const APP_LAUNCHED_REGEX = /^(?:Xcode build done|✓ Built |Installing and launching|Syncing files to device)/;

// Flutter.Error blocks: "════════ Exception caught by rendering library ═════" ... "═══════════"
const FLUTTER_ERROR_HEADER_REGEX = /^═{3,} .+ ═*$/;
const FLUTTER_ERROR_FOOTER_REGEX = /^═{3,}$/;

// Messages printed by flutter_tools, pub and the debug adapter. Before app.started they arrive as
// console, after it as stdout - both mixed with native device output.
const FLUTTER_TOOL_REGEXES = [
  /^Launching .+ in (?:debug|profile|release) mode/,
  /^Resolving dependencies/,
  /^Downloading packages/,
  /^Got dependencies/,
  /^Changed \d+ dependenc/,
  /^\d+ packages? (?:has|have) newer versions/,
  /^Try `(?:flutter|dart) pub outdated`/,
  /^[!+~-]? *[\w-]+ \S+(?: \(overridden\))? \(.+ available\)$/,
  /^Automatically signing iOS/,
  /^Running (?:pod install|Gradle task|Xcode build)/,
  /^Xcode build done/,
  /^Building .+ application/,
  /^✓ Built /,
  /^Installing .+\.\.\.$/,
  /^Installing and launching/,
  /^Warning: Missing build (?:name|number)/,
  /^Connecting to VM Service/,
  /^Connected to the VM Service/,
  /^Debug service listening on/,
  /^Exited\b/,
  /^Reloaded \d+ (?:of \d+ )?librar/,
  /^Restarted application in/,
  /^Performing hot (?:reload|restart)/,
  /^Hot (?:reload|restart)/,
  /^Initializing hot reload/,
  /^Syncing files to device/,
  /^Application finished\./,
  /^Lost connection to device\./,
  /^Try again after fixing the above error/,
  /^Another exception was thrown:/,
  /^A Dart VM Service on .+ is available/,
  /^The Flutter DevTools debugger and profiler/,
];

export function getSessionProfile(session: vscode.DebugSession): SessionProfile {
  if (session.type !== 'dart') {
    return 'generic';
  }
  return DART_CODE_FLUTTER_DEBUGGER_TYPES.includes(session.configuration.debuggerType) ? 'flutter' : 'dart';
}

function firstLine(output: string): string {
  const stripped = output.replace(ANSI_ESCAPE_REGEX, '');
  return stripped.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? '';
}

/**
 * Classifies raw DAP output (before cleanMessage) by where it came from.
 * One instance per debug session: Flutter error blocks span several output events.
 */
export class LogSourceClassifier {
  private inFlutterErrorBlock = false;
  private appLaunched = false;

  constructor(private readonly profile: SessionProfile) {}

  public classify(output: string, category: string): LogSource {
    const line = firstLine(output);

    switch (this.profile) {
      case 'flutter':
        return this.classifyFlutter(line, category);
      case 'dart':
        if (category === 'console') {
          return DEVELOPER_LOG_PREFIX_REGEX.test(line) ? 'app' : 'debugger';
        }
        return 'app';
      default:
        return category === 'console' || category === 'important' ? 'debugger' : 'app';
    }
  }

  private classifyFlutter(line: string, category: string): LogSource {
    if (APP_LAUNCHED_REGEX.test(line)) {
      this.appLaunched = true;
    }

    // Flutter.Error: header/footer arrive as stderr, the body in between as stdout
    if (category === 'stderr' && FLUTTER_ERROR_HEADER_REGEX.test(line)) {
      this.inFlutterErrorBlock = true;
      return 'flutter';
    }
    if (this.inFlutterErrorBlock) {
      if (category === 'stderr' && FLUTTER_ERROR_FOOTER_REGEX.test(line)) {
        this.inFlutterErrorBlock = false;
      }
      return 'flutter';
    }

    const logcat = line.match(LOGCAT_PREFIX_REGEX);
    if (logcat) {
      const message = line.slice(logcat[0].length);
      if (ENGINE_LOG_REGEX.test(message)) {
        return 'flutter';
      }
      return logcat[2] === 'flutter' ? 'app' : 'platform';
    }

    if (FLUTTER_PRINT_PREFIX_REGEX.test(line)) {
      return 'app';
    }
    if (ENGINE_LOG_REGEX.test(line)) {
      return 'flutter';
    }

    switch (category) {
      case 'console':
      case 'stdout':
        if (category === 'console' && DEVELOPER_LOG_PREFIX_REGEX.test(line)) {
          return 'app';
        }
        if (FLUTTER_TOOL_REGEXES.some((regex) => regex.test(line))) {
          return 'flutter';
        }
        // Unknown lines: tool output while building, native device logs once the app is launched
        // (stdout is only used after app.started, e.g. also for `flutter attach` with no build step)
        return category === 'stdout' || this.appLaunched ? 'platform' : 'flutter';
      default:
        // stderr of the `flutter run` process
        return 'flutter';
    }
  }
}
