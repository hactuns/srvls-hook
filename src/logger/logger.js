import { config, createLogger, format, transports } from 'winston';
import CloudwatchTransport from 'cloudwatch-transport';
import TelegramLogger from 'winston-telegram';

const currentDate = new Date();

const Logger = createLogger({
  levels: config.syslog.levels,
  level: 'debug',
  format: format.json(),
  transports: [
    new transports.Console({
      format: format.combine(
        format.metadata(),
        format.printf((info) => {
          return `[${new Date().toISOString()}] [${info.level.toUpperCase()}]: ${info.message} - ${JSON.stringify(info.metadata ?? {})}`;
        }),
        format.colorize({ all: true })
      ),
    }),
    new CloudwatchTransport({
      logGroupName: String(process.env.AWS_LOG_GROUP),
      logStreamName: [
        currentDate.getDate(),
        currentDate.getMonth(),
        currentDate.getFullYear(),
      ].join('/'),
      awsCredentials: {
        accessKeyId: String(process.env.AWS_KEY),
        secretAccessKey: String(process.env.AWS_SECRET),
        region: String(process.env.AWS_REGION),
      },
      enabled: String(process.env.NODE_ENV) !== 'dev',
    }),
    ...(process.env.TELEGRAM_TOKEN && [
      new TelegramLogger({
        token: String(process.env.TELEGRAM_TOKEN),
        chatId: String(process.env.TELEGRAM_CHAT_ID),
        enabled: String(process.env.NODE_ENV) !== 'dev',
        formatMessage: (params, info) => {
          const { message, level, ...metadata } = Object.assign(params, info);

          return `[${level.toUpperCase()}]: ${message} - ${JSON.stringify(metadata ?? {})}`;
        },
      }),
    ]),
  ],
});

export default Logger;
