type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }

    return baseMessage;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.formatMessage('error', message, meta));
  }

  // Specialized logging methods
  logRequest(method: string, url: string, statusCode: number, duration: number): void {
    const level: LogLevel = statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${url} - ${statusCode} (${duration}ms)`);
  }

  logDatabaseQuery(query: string, duration: number): void {
    this.debug(`DB Query: ${query} (${duration}ms)`);
  }

  logOpenAIRequest(model: string, tokens: number, duration: number): void {
    this.info(`OpenAI ${model}: ${tokens} tokens (${duration}ms)`);
  }
}

export const logger = new Logger();