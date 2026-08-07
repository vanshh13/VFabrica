const pino = require('pino');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'password',
    '*.password',
    'password_hash',
    '*.password_hash',
    'token',
    '*.token',
    'secret',
    '*.secret',
    'apiKey',
    '*.apiKey',
    'apiSecret',
    '*.apiSecret',
    'authorization',
    '*.authorization'
  ],
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

const httpLoggerOptions = {
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
        },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
};

module.exports = {
  logger,
  httpLoggerOptions
};
