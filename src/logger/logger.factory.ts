/**
 * The MIT License (MIT)
 *
 * Copyright (C) 2019 Motorola Solutions, Inc
 * All rights reserved
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { basename, dirname } from 'path';
import * as pino from 'pino';
import { Logger, LoggerOptions } from 'pino';
import { AppLogger } from '../interface/app.logger';
import { DEFAULT_LOGGER_CONFIG } from './default.config';
import { AppLoggerOptions } from '../interface/app.logger.options';
import { NoopChanger } from '../levelChanger/noop.changer';
import { LevelChanger } from '../interface/level.changer';
import { FileLevelChanger } from '../levelChanger/file.level.changer';
import { HttpLogger, Options } from 'pino-http';
import { requestSerializer, customLogLevel, DEFAULT_MIDDLEWARE_CONFIG } from '../http';
import * as pinoHttp from 'pino-http';
export class LoggerFactory {
  private static readonly DIRNAME_LENGTH = require && require.main ? dirname(require.main.filename).length + 1 : 0;
  private static readonly FACTORY_FILENAME = basename(__filename);

  private static CONFIG: AppLoggerOptions;
  private static PARENT_LOGGER: Logger;
  private static LOGGERS = new Map<string, Logger>();
  private static LEVEL_CHANGER: LevelChanger = new NoopChanger();

  private static HTTP_LOGGER: HttpLogger;

  static forRoot(config: AppLoggerOptions) {
    this.CONFIG = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.PARENT_LOGGER = pino(this.CONFIG);

    if (this.CONFIG.changeConfig) {
      const changerLogger: any = this.PARENT_LOGGER.child({
        className: FileLevelChanger.name
      });
      this.LEVEL_CHANGER = new FileLevelChanger(changerLogger, this.CONFIG.changeConfig, this.CONFIG.level || 'info');
      this.LEVEL_CHANGER.initialize();
    }
    this.LEVEL_CHANGER.registerLogger('PARRENT_LOGGER', this.PARENT_LOGGER as any);
  }

  static createLogger(className?: string): AppLogger {
    if (!this.PARENT_LOGGER) {
      throw new Error('Config not set. Please Execute LoggerFactory.forRoot() at the very beginning of Your app (even before imports)');
    }
    className = className || this.getChildLoggerName();

    let logger: any = this.LOGGERS.get(className);
    if (!logger) {
      logger = this.PARENT_LOGGER.child({ className });
      this.LOGGERS.set(className, logger);
      this.LEVEL_CHANGER.registerLogger(className, logger);
    }
    return logger as any;
  }

  static createHttpLoggerMiddleware(config?: LoggerOptions, httpConfig?: Options): HttpLogger {
    if (!this.HTTP_LOGGER) {
      const logger = pino({
        ...DEFAULT_LOGGER_CONFIG,
        ...DEFAULT_MIDDLEWARE_CONFIG,
        ...config
      });

      const options: Options = {
        logger,
        customLogLevel,
        serializers: { req: requestSerializer },
        ...httpConfig
      };
      const middleware: any = pinoHttp(options);
      this.HTTP_LOGGER = middleware;
      this.LEVEL_CHANGER.registerLogger('http', middleware);
    }
    return this.HTTP_LOGGER;
  }

  private static getFileName(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    const originalStackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 5;
    Error.prepareStackTrace = (err: Error, stack: NodeJS.CallSite[]) => {
      Error.prepareStackTrace = originalPrepareStackTrace;
      Error.stackTraceLimit = originalStackTraceLimit;
      return stack;
    };

    const error = new Error();
    const stackFrames = (error.stack as unknown) as NodeJS.CallSite[];

    const filenames = stackFrames
      .map(frame => frame.getFileName() as string)
      .filter(fileName => !!fileName)
      .filter(fileName => !fileName.includes(this.FACTORY_FILENAME));

    return filenames[0];
  }

  private static getChildLoggerName(): string {
    const fileName = this.getFileName()
      .substr(this.DIRNAME_LENGTH)
      .replace('.js', '.ts');
    return fileName;
  }
}
