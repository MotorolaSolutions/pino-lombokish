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
const LEVEL_CHANGER_MOCK: any = jest.genMockFromModule('../levelChanger/file.level.changer');

jest.mock('pino', () => PINO_MOCK);
jest.mock('pino-http', () => PINO_HTTP_MOCK);
jest.mock('../levelChanger/file.level.changer', () => LEVEL_CHANGER_MOCK);

import { LoggerFactory } from './logger.factory';
import { LoggerOptions } from 'pino';
import './../levelChanger/file.level.changer';
import { AppLoggerOptions } from '../interface';

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

    it('Should Initialize Level Changer if enabled', done => {
      LoggerFactory.forRoot({
        level: 'info',
        prettyPrint: false,
        name: 'App',
        changeConfig: {
          path: './foo/bar'
        }
      });
      expect(LEVEL_CHANGER_MOCK.FileLevelChanger).toHaveBeenCalledTimes(1);
      expect(LEVEL_CHANGER_MOCK.FileLevelChanger.mock.instances[0].initialize).toHaveBeenCalledTimes(1);
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
      (LoggerFactory as any).HTTP_LOGGER = undefined;
    });

    it('Should create logger middleware', done => {
      LoggerFactory.createHttpLoggerMiddleware();

      expect(PINO_MOCK).toHaveBeenCalledTimes(1);
      expect(PINO_HTTP_MOCK).toHaveBeenCalledTimes(1);
      done();
    });

    it('Should not create HTTP Logger instance once it was created', done => {
      LoggerFactory.createHttpLoggerMiddleware();
      LoggerFactory.createHttpLoggerMiddleware();
      expect(PINO_MOCK).toHaveBeenCalledTimes(1);
      expect(PINO_HTTP_MOCK).toHaveBeenCalledTimes(1);
      done();
    });
  });

  describe('Sensitive Logging', () => {
    it('Should create default sensitive binding', done => {
      LoggerFactory.forRoot({
        sensitive: true
      });
      const logger = LoggerFactory.createLogger('DefaultSensitive');
      expect(logger.sensitive).toBeDefined();
      expect(logger.sensitive).not.toBe(logger);
      expect(logger.sensitive.sensitive).toBe(logger.sensitive);

      const spy = jest.spyOn(logger, 'info');
      logger.sensitive.info('foo');

      expect(logger.info).toHaveBeenCalledWith({ isSensitive: true }, 'foo');
      spy.mockRestore();
      done();
    });

    it('Should create User Provided sensitive binding', done => {
      LoggerFactory.forRoot({
        sensitive: {
          sensitiveName: 'mySensitive',
          sensitiveValue: 'myValue'
        }
      });

      const logger = LoggerFactory.createLogger('UserSensitive');
      expect(logger.sensitive).toBeDefined();
      expect(logger.sensitive).not.toBe(logger);
      const spy = jest.spyOn(logger, 'info');
      logger.sensitive.info('foo');

      expect(logger.info).toHaveBeenCalledWith({ mySensitive: 'myValue' }, 'foo');
      spy.mockRestore();
      done();
    });

    it('Should not create sensitive binding when sensitive is false', done => {
      LoggerFactory.forRoot({
        sensitive: false
      });
      const logger = LoggerFactory.createLogger('SensitiveFalse');
      const spy = jest.spyOn(logger, 'info');
      logger.sensitive.info('foo');
      expect(logger.info).toHaveBeenCalledWith('foo');
      spy.mockRestore();
      done();
    });

    it('Should not create sensitive binding when sensitive is not provided', done => {
      LoggerFactory.forRoot({});
      const logger = LoggerFactory.createLogger('NoSensitive');
      const spy = jest.spyOn(logger, 'info');
      logger.sensitive.info('foo');
      expect(logger.info).toHaveBeenCalledWith('foo');
      spy.mockRestore();
      done();
    });

    it('Should not create sensitive binding when bogus config was provided', done => {
      const sensitiveConfig: any = {
        someName: 'some',
        someValue: 'some'
      };

      LoggerFactory.forRoot({
        sensitive: sensitiveConfig
      });
      const logger = LoggerFactory.createLogger('NoSensitiveBogusConfig');
      const spy = jest.spyOn(logger, 'info');
      logger.sensitive.info('foo');
      expect(logger.info).toHaveBeenCalledWith('foo');
      spy.mockRestore();
      done();
    });
  });
});
