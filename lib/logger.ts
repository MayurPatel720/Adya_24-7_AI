type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LEVEL_PRIORITY[process.env.LOG_LEVEL as LogLevel] || LEVEL_PRIORITY.info;

function log(level: LogLevel, prefix: string, message: string, data?: any) {
  if (LEVEL_PRIORITY[level] < MIN_LEVEL) return;

  const ts = new Date().toISOString();
  const tag = `[${ts}] [${level.toUpperCase()}] [${prefix}]`;
  const msg = data ? `${message} ${JSON.stringify(data)}` : message;

  switch (level) {
    case 'error': console.error(`${tag} ${msg}`); break;
    case 'warn': console.warn(`${tag} ${msg}`); break;
    case 'debug': console.debug(`${tag} ${msg}`); break;
    default: console.log(`${tag} ${msg}`);
  }
}

export const logger = {
  info: (prefix: string, msg: string, data?: any) => log('info', prefix, msg, data),
  warn: (prefix: string, msg: string, data?: any) => log('warn', prefix, msg, data),
  error: (prefix: string, msg: string, data?: any) => log('error', prefix, msg, data),
  debug: (prefix: string, msg: string, data?: any) => log('debug', prefix, msg, data),
};
