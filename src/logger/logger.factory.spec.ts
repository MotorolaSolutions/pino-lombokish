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

/**
 * Copyright (C) 2019 Motorola Solutions, Inc.
 */

const PINO_MOCK: jest.Mock = jest.genMockFromModule('pino');
const PINO_HTTP_MOCK: jest.Mock = jest.genMockFromModule('pino-http');
jest.mock('pino', () => PINO_MOCK);
jest.mock('pino-http', () => PINO_HTTP_MOCK);

import { LoggerFactory } from './logger.factory';
import { LoggerOptions } from 'pino';

describe('LoggerFactory', () => {
  const PINO_LOGGER_MOCK = {
    child: jest.fn().mockReturnThis(),
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn()
  };

  beforeEach(done => {
    jest.clearAllMocks();
    PINO_MOCK.mockImplementation(() => PINO_LOGGER_MOCK);
    done();
  });

  describe('Init', () => {
    it('Should throw when forRoot not invoked', done => {
      expect(() => LoggerFactory.createLogger()).toThrowError();
      expect(PINO_MOCK).toHaveBeenCalledTimes(0);
      done();
    });
  });

  describe('Factory', () => {
    const defaultConfig: LoggerOptions = {
      level: 'info',
      prettyPrint: false,
      name: 'App'
    };

    beforeEach(done => {
      LoggerFactory.forRoot(defaultConfig);
      expect(PINO_MOCK).toHaveBeenCalledTimes(1);
      done();
    });

    it('Should create Child Logger only once with automatically determined className from fileName', done => {
      let logger = LoggerFactory.createLogger();
      logger = LoggerFactory.createLogger();
      expect(PINO_LOGGER_MOCK.child).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.child).toHaveBeenCalledWith({
        className: `logger.factory.spec.ts`
      });
      done();
    });

    it('Should create Child Logger only once with provided className', done => {
      let logger = LoggerFactory.createLogger('Foo');
      logger = LoggerFactory.createLogger('Foo');
      expect(PINO_LOGGER_MOCK.child).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.child).toHaveBeenCalledWith({ className: `Foo` });
      done();
    });
  });

  describe('HTTP Middleware factory', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      PINO_HTTP_MOCK.mockImplementation(() => {
        return {
          logger: {}
        };
      });
    });

    it('Should create logger middleware', done => {
      LoggerFactory.createHttpLoggerMiddleware();

      expect(PINO_MOCK).toHaveBeenCalledTimes(1);
      expect(PINO_HTTP_MOCK).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
