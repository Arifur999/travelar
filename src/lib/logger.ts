/**
 * One channel for everything the web server says, mirroring the API's
 * `src/app/lib/logger.ts` so both tiers read the same way in a log viewer.
 *
 * Production writes one JSON object per line; development writes a short human
 * line. `LOG_LEVEL` overrides the default.
 *
 * Deliberately dependency-free and free of Node built-ins: `proxy.ts` may run
 * in the Edge runtime, and it logs too.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const isLevel = (value: string | undefined): value is LogLevel =>
  value !== undefined && Object.prototype.hasOwnProperty.call(LEVELS, value);

const defaultLevel = (): LogLevel => {
  const configured = process.env.LOG_LEVEL;
  if (isLevel(configured)) return configured;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

let level: LogLevel = defaultLevel();

export type LogFields = Record<string, unknown>;

/** Where lines go. Swapped in tests to read what was logged. */
export type LogWriter = (line: string, entry: LogFields & { level: LogLevel; msg: string }) => void;

const consoleWriter: LogWriter = (line, entry) => {
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.log(line);
};

let writer: LogWriter = consoleWriter;

/** Test hook: returns a function that restores the previous writer. */
export const setLogWriter = (next: LogWriter) => {
  const previous = writer;
  writer = next;
  return () => {
    writer = previous;
  };
};

export const setLogLevel = (next: LogLevel) => {
  level = next;
};

const write = (entryLevel: LogLevel, msg: string, fields: LogFields = {}) => {
  if (LEVELS[entryLevel] < LEVELS[level]) return;

  const entry = { level: entryLevel, time: new Date().toISOString(), msg, ...fields };

  if (process.env.NODE_ENV === "production") {
    writer(JSON.stringify(entry), entry);
    return;
  }

  const detail = Object.entries(fields)
    .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" ");
  writer(`${entryLevel.toUpperCase().padEnd(5)} ${msg}${detail ? ` ${detail}` : ""}`, entry);
};

export const logger = {
  debug: (msg: string, fields?: LogFields) => write("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => write("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => write("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => write("error", msg, fields),
};
