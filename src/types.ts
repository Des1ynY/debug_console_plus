export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** DAP output event group: start/end of a logical group (e.g. box borders around a log entry). */
export type DapOutputGroup = 'start' | 'startCollapsed' | 'end';

/** Where a log line came from: user code, Flutter framework/tooling, native platform, or the debug adapter itself. */
export type LogSource = 'app' | 'flutter' | 'platform' | 'debugger';

export interface ParsedLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  category: string;
  sessionId: string;
  /** Missing on logs loaded from files saved by older versions. */
  source?: LogSource;
  /** Set when DAP output event had group; used for level inheritance from content line. */
  group?: DapOutputGroup;
}

export type TimestampMode = 'absolute' | 'relative' | 'hidden';

export type LogsUpdate = { type: 'full'; logs: ParsedLog[] } | { type: 'append'; log: ParsedLog };

export interface WebviewMessage {
  type: 'logs' | 'newLog' | 'clear' | 'config' | 'setFilter' | 'copyAll' | 'toggleCompact' | 'toggleTags' | 'packageInfo' | 'focusFilter';
  logs?: ParsedLog[];
  log?: ParsedLog & { formattedTimestamp?: string };
  config?: {
    timestampMode: TimestampMode;
    autoHideTimestampsWidth: number;
    showLogSource: boolean;
    showLogLevel: boolean;
    defaultLevels?: string[];
  };
  filter?: string;
  /** Package names whose rootUri is under a workspace folder (user code). Sent so webview can style links. */
  localPackageNames?: string[];
}

export interface WebviewToExtensionMessage {
  type: 'ready' | 'toggleLevel' | 'search' | 'copyAll' | 'toggleTimestamps' | 'openFile' | 'openUrl';
  level?: LogLevel;
  searchQuery?: string;
  filePath?: string;
  line?: number;
  column?: number;
  scheme?: string;
  url?: string;
}

