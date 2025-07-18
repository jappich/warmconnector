import * as winston from 'winston';
import * as path from 'path';

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const serviceStr = service ? `[${service}]` : '';
    return `${timestamp} ${level} ${serviceStr} ${message} ${metaStr}`;
  })
);

// Create logger instance
const winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'warmconnector' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    }),
  ],
});

// Create logs directory if it doesn't exist
import * as fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced logger with additional utility methods
export class Logger {
  private winston: winston.Logger;
  private context: string;

  constructor(context: string = 'general') {
    this.winston = winstonLogger;
    this.context = context;
  }

  private formatMessage(message: string, meta?: any): [string, any] {
    const formattedMessage = `[${this.context}] ${message}`;
    const formattedMeta = { ...meta, context: this.context };
    return [formattedMessage, formattedMeta];
  }

  error(message: string, meta?: any): void {
    const [msg, metaData] = this.formatMessage(message, meta);
    this.winston.error(msg, metaData);
  }

  warn(message: string, meta?: any): void {
    const [msg, metaData] = this.formatMessage(message, meta);
    this.winston.warn(msg, metaData);
  }

  info(message: string, meta?: any): void {
    const [msg, metaData] = this.formatMessage(message, meta);
    this.winston.info(msg, metaData);
  }

  http(message: string, meta?: any): void {
    const [msg, metaData] = this.formatMessage(message, meta);
    this.winston.http(msg, metaData);
  }

  debug(message: string, meta?: any): void {
    const [msg, metaData] = this.formatMessage(message, meta);
    this.winston.debug(msg, metaData);
  }

  // Performance logging
  time(label: string): void {
    console.time(`${this.context}:${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`${this.context}:${label}`);
  }

  // Database query logging
  query(query: string, params?: any, duration?: number): void {
    this.debug('Database query executed', {
      query: query.length > 200 ? query.substring(0, 200) + '...' : query,
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // API request logging
  request(method: string, url: string, statusCode?: number, duration?: number): void {
    const level = statusCode && statusCode >= 400 ? 'warn' : 'http';
    this[level]('API request', {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // Security logging
  security(event: string, details?: any): void {
    this.warn(`Security event: ${event}`, {
      securityEvent: true,
      ...details,
    });
  }

  // Business logic logging
  business(event: string, details?: any): void {
    this.info(`Business event: ${event}`, {
      businessEvent: true,
      ...details,
    });
  }

  // Service health logging
  health(service: string, status: 'healthy' | 'degraded' | 'unhealthy', details?: any): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    this[level](`Service health: ${service} is ${status}`, {
      healthCheck: true,
      service,
      status,
      ...details,
    });
  }
}

// Export default logger and Logger class
export const defaultLogger = new Logger();

// Export factory function for creating contextual loggers
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

// Export winston instance for advanced usage
export { winston };

// Middleware for Express request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const reqLogger = new Logger('http');
  
  // Log incoming request
  reqLogger.request(req.method, req.originalUrl);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    reqLogger.request(req.method, req.originalUrl, res.statusCode, duration);
  });
  
  next();
};

export default defaultLogger;

// Backward compatibility export for services that import { logger }
export const logger = defaultLogger;