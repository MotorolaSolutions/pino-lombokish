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

const FS_MOCK: any = jest.genMockFromModule('fs');
const NODE_WATCH_MOCK: jest.Mock = jest.genMockFromModule('node-watch');
jest.mock('fs', () => FS_MOCK);
jest.mock('node-watch', () => NODE_WATCH_MOCK);

import { LevelChangerConfig } from '../interface';
import { FileLevelChanger } from './file.level.changer';
import { schema } from './level.config.schema';

describe('Level Changer', () => {
  const PINO_LOGGER_MOCK: any = {
    child: jest.fn().mockReturnThis(),
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    level: 'fatal'
  };

  const config: LevelChangerConfig = {
    path: '/etc/levels/levels.json'
  };

  const watcherMock = {
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    close: jest.fn()
  };

  let changer: FileLevelChanger;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    changer = new FileLevelChanger(PINO_LOGGER_MOCK, config, 'info');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    beforeEach(() => {
      (changer as any).handleChangeEvt = jest.fn();
    });

    it('Should initialize', () => {
      NODE_WATCH_MOCK.mockReturnValue(watcherMock);
      changer.initialize();
      expect(NODE_WATCH_MOCK).toHaveBeenCalledTimes(1);
      expect(NODE_WATCH_MOCK).toHaveBeenCalledWith(config.path, { persistent: true }, expect.any(Function));
      expect(watcherMock.on).toHaveBeenCalledTimes(1);
      expect(watcherMock.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect((changer as any).handleChangeEvt).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(0);
    });

    it('Should initialize (file does not exist)', () => {
      NODE_WATCH_MOCK.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      changer.initialize();
      expect(NODE_WATCH_MOCK).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('Should restart watcher upon timeout', () => {
      NODE_WATCH_MOCK.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      changer.initialize();
      expect(NODE_WATCH_MOCK).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);

      jest.resetAllMocks();
      NODE_WATCH_MOCK.mockReturnValue(watcherMock);
      jest.runAllTimers();

      expect(NODE_WATCH_MOCK).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(0);
      expect(watcherMock.on).toHaveBeenCalledTimes(1);
      expect(watcherMock.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('Should restart watcher on watcher error', () => {
      NODE_WATCH_MOCK.mockReturnValue(watcherMock);
      changer.initialize();
      expect(NODE_WATCH_MOCK).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(0);

      const errorCb = watcherMock.on.mock.calls[0][1];
      expect(errorCb).toBeInstanceOf(Function);

      errorCb(new Error('error'));
      expect(watcherMock.removeAllListeners).toHaveBeenCalledTimes(1);
      expect(watcherMock.close).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('File Removed', () => {
    it('Should restart watcher upon file remove', async done => {
      const changeTrigger = async () => {
        await (changer as any).handleChangeEvt('remove', config.path);
      };

      await changeTrigger();
      expect(setTimeout).toHaveBeenCalledTimes(1);
      done();
    });
  });

  describe('Unknown event', () => {
    it('Should ignore unknown event', async done => {
      const changeTrigger = async () => {
        await (changer as any).handleChangeEvt('unknown', config.path);
      };

      await changeTrigger();
      expect(setTimeout).toHaveBeenCalledTimes(0);
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(0);
      done();
    });
  });

  describe('Level changes', () => {
    let parseSpy: jest.SpyInstance;
    let validateSpy: jest.SpyInstance;
    let changeTrigger: Function;

    beforeEach(done => {
      PINO_LOGGER_MOCK.level = 'fatal';
      parseSpy = jest.spyOn(JSON, 'parse');
      validateSpy = jest.spyOn(schema, 'validate');
      changeTrigger = async () => {
        await (changer as any).handleChangeEvt('update', config.path);
      };
      done();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Error Reading file', async done => {
      FS_MOCK.readFile.mockImplementation((fileName: string, cb: Function) => {
        cb(new Error('test'), null);
      });
      await changeTrigger('Error Reading File');
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(1);
      expect(FS_MOCK.readFile).toHaveBeenCalledWith(config.path, expect.any(Function));
      expect(parseSpy).not.toHaveBeenCalled();
      expect(validateSpy).not.toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.level).toBe('fatal');
      done();
    });

    it('File Read OK, wrong JSON', async done => {
      FS_MOCK.readFile.mockImplementationOnce((fileName: string, cb: Function) => {
        cb(null, Buffer.from('abcd'));
      });

      await changeTrigger();
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(1);
      expect(FS_MOCK.readFile).toHaveBeenCalledWith(config.path, expect.any(Function));
      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).not.toHaveBeenCalled();
      expect(PINO_LOGGER_MOCK.level).toBe('fatal');
      done();
    });

    it('File Read OK, JSON OK, Wrong Schema', async done => {
      FS_MOCK.readFile.mockImplementationOnce((fileName: string, cb: Function) => {
        const levels = {};
        cb(null, Buffer.from(JSON.stringify(levels)));
      });

      await changeTrigger();
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(1);
      expect(FS_MOCK.readFile).toHaveBeenCalledWith(config.path, expect.any(Function));
      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.level).toBe('fatal');
      done();
    });

    it('File Read OK, JSON OK, Schema OK, only level', async done => {
      FS_MOCK.readFile.mockImplementationOnce((fileName: string, cb: Function) => {
        const levels = {
          level: 'info'
        };
        cb(null, Buffer.from(JSON.stringify(levels)));
      });

      await changeTrigger();
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(1);
      expect(FS_MOCK.readFile).toHaveBeenCalledWith(config.path, expect.any(Function));
      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.level).toBe('info');
      done();
    });

    it('File Read OK, JSON OK, Schema OK, level and levels', async done => {
      FS_MOCK.readFile.mockImplementationOnce((fileName: string, cb: Function) => {
        const levels = {
          level: 'info',
          levels: {
            LevelChanger: 'warn'
          }
        };
        cb(null, Buffer.from(JSON.stringify(levels)));
      });

      await changeTrigger();
      expect(FS_MOCK.readFile).toHaveBeenCalledTimes(1);
      expect(FS_MOCK.readFile).toHaveBeenCalledWith(config.path, expect.any(Function));
      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(PINO_LOGGER_MOCK.level).toBe('warn');
      done();
    });
  });
});
