const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

const currentLevel = process.env.LOG_LEVEL === 'debug' ? 3 : 
                     process.env.LOG_LEVEL === 'info' ? 2 :
                     process.env.LOG_LEVEL === 'warn' ? 1 : 2;

function formatTime() {
  return new Date().toISOString();
}

function formatMsg(level: string, ...args: any[]) {
  return `[${formatTime()}] [${level.toUpperCase()}]`;
}

export const logger = {
  error: (...args: any[]) => {
    if (currentLevel >= 0) console.error(formatMsg('error'), ...args);
  },
  warn: (...args: any[]) => {
    if (currentLevel >= 1) console.warn(formatMsg('warn'), ...args);
  },
  info: (...args: any[]) => {
    if (currentLevel >= 2) console.log(formatMsg('info'), ...args);
  },
  debug: (...args: any[]) => {
    if (currentLevel >= 3) console.log(formatMsg('debug'), ...args);
  },
};
