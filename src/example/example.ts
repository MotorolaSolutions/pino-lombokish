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

import { createServer } from 'http';
import { LoggerFactory, AppLogger, Logger } from '../';

LoggerFactory.forRoot({
  level: 'debug',
  name: 'example',
  changeConfig: {
    path: './src/example/levels.json'
  },
  sensitive: true
});

class Foo {
  @Logger()
  private logger: AppLogger;

  constructor() {
    this.logger.info('This will show Foo as className');
    this.logger.sensitive.info('This will add sensitive binding to log message');
  }
}

async function bootstrap() {
  const logger = LoggerFactory.createLogger();
  logger.info('This will show "example.ts" as className');
  const loggerExplicit = LoggerFactory.createLogger('explicit');
  loggerExplicit.info('This will show "explicit" as className');

  const httpLogger = LoggerFactory.createHttpLoggerMiddleware();
  const server = createServer((req, res) => {
    httpLogger(req, res);
    res.end('Hello');
  });

  const obj = new Foo();
  server.listen(3000);

  const interval = 3000;
  setInterval(() => {
    logger.info(`Logging every ${interval / 1000} seconds, change 'example.ts' level in levels.json to warn to disable`);
  }, interval);
}

bootstrap();
