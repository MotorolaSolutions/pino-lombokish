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

import 'reflect-metadata';
import { LoggerFactory } from './logger.factory';
import { Logger } from './logger.decorator';
import { AppLogger } from '../interface/app.logger';
describe('Logger Decorator', () => {
  const dummyLogger: any = {};
  const createLoggerSpy = jest.spyOn(LoggerFactory, 'createLogger').mockReturnValue(dummyLogger);
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`Should create logger instance in class when member is ${AppLogger.name}`, done => {
    class MyClassAppLogger {
      @Logger()
      logger: AppLogger;
    }

    const foo = new MyClassAppLogger();
    expect(createLoggerSpy).toHaveBeenCalledTimes(1);
    expect(createLoggerSpy).toHaveBeenCalledWith(MyClassAppLogger.name);
    expect(foo.logger).toBe(dummyLogger);
    done();
  });

  it('Should create logger when no type specified', done => {
    class MyClassNoType {
      @Logger()
      logger: any;
    }

    const instance = new MyClassNoType();
    expect(createLoggerSpy).toHaveBeenCalledTimes(1);
    expect(createLoggerSpy).toHaveBeenCalledWith(MyClassNoType.name);
    expect(instance.logger).toBe(dummyLogger);
    done();
  });

  it(`Should throw when member is not an instance of ${AppLogger.name}`, done => {
    class SomeLogger {}

    expect(() => {
      class MyClassSomeLogger {
        @Logger()
        logger: SomeLogger;
      }
    }).toThrow(`MyClassSomeLogger::logger must be instance of ${AppLogger.name} or any`);
    done();
  });

  it('Should create logger for static class', done => {
    expect(() => {
      class MyStaticClass {
        @Logger()
        private static logger: AppLogger;
      }
    }).not.toThrow();

    done();
  });
});
