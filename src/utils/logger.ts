const PREFIX = '[Claude Bridge]';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.log(PREFIX, '[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.log(PREFIX, '[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(PREFIX, '[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error(PREFIX, '[ERROR]', ...args);
  },
};
