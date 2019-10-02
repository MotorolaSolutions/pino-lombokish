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

import { FSWatcher, readFile } from 'fs';
import watch from 'node-watch';
import { LevelWithSilent } from 'pino';

import { AppLogger } from '../interface';
import { LevelChanger } from '../interface/level.changer';
import { LevelChangerConfig } from '../interface/level.changer.config';
import { LevelConfig } from '../interface/level.config';
import { schema } from './level.config.schema';

enum ChangeEventType {
  update = 'update',
  remove = 'remove'
}

export class FileLevelChanger implements LevelChanger {
  private static RESTART_TIMEOUT = 10; // seconds

  private watcher: FSWatcher | undefined;
  private changeConfig: LevelChangerConfig;
  private levelConfig: LevelConfig = { level: 'info' };

  private loggers: Map<string, AppLogger> = new Map();

  constructor(private logger: AppLogger, config: LevelChangerConfig, startingLevel: string) {
    this.changeConfig = { ...config };
    this.levelConfig.level = startingLevel;
    this.registerLogger('LevelChanger', this.logger);
  }

  initialize() {
    this.tryStartWatching();
  }

  registerLogger(className: string, logger: AppLogger) {
    this.loggers.set(className, logger);
    this.changeLoggerLevel(logger, className);
  }

  private tryStartWatching = () => {
    try {
      this.watcher = watch(this.changeConfig.path, { persistent: true }, this.handleChangeEvt);
      this.watcher.on('error', this.handleError);
      // Watcher does not invoke any event upon start so simulate one
      this.handleChangeEvt(ChangeEventType.update, this.changeConfig.path);
    } catch (err) {
      this.logger.trace(`Got ${err.code} when trying to start watch. Restarting after ${FileLevelChanger.RESTART_TIMEOUT} seconds`);
      this.restartWatcher();
    }
  };

  private restartWatcher() {
    if (this.watcher) {
      this.watcher.removeAllListeners('error');
      this.watcher.close();
      this.watcher = undefined;
    }
    setTimeout(this.tryStartWatching, FileLevelChanger.RESTART_TIMEOUT * 1000);
  }

  private handleError = (err: Error) => {
    this.logger.trace('Restarting Watcher due to error', err.message);
    this.restartWatcher();
  };

  private handleChangeEvt = async (event: string, fileName: string) => {
    switch (event) {
      case ChangeEventType.update:
        return this.handleFileUpdate(fileName);
      case ChangeEventType.remove:
        this.logger.trace('Restarting watcher due to file removed');
        return this.restartWatcher();
      default:
        this.logger.trace('Ignoring unknown event', event);
    }
  };

  private async handleFileUpdate(fileName: string) {
    try {
      const newConfig = await this.readFile(fileName);
      if (newConfig === this.levelConfig) {
        return;
      }

      const validatedConfig = await this.validateConfig(newConfig);
      if (validatedConfig === this.levelConfig) {
        return;
      }

      this.levelConfig = validatedConfig;
      this.logger.trace('Applying new config', this.levelConfig);
      this.changeLoggerLevels();
    } catch (err) {
      this.logger.trace(`Restarting watcher due to `, err.message);
      this.restartWatcher();
    }
  }

  private changeLoggerLevels() {
    this.loggers.forEach((logger, className) => this.changeLoggerLevel(logger, className));
  }

  private changeLoggerLevel(logger: AppLogger, className: string) {
    const level =
      this.levelConfig.levels && this.levelConfig.levels[className] ? this.levelConfig.levels[className] : this.levelConfig.level;
    if (level) {
      this.logger.trace('Changing Logger Level', className, level);
      logger.level = level as LevelWithSilent;
    }
  }

  private async readFile(fileName: string): Promise<LevelConfig> {
    return new Promise<LevelConfig>((resolve, reject) => {
      readFile(fileName, (err, data) => {
        if (err) {
          this.logger.trace('Unable to read file', fileName, err.code);
          return reject(new Error('Unable to read file'));
        }

        this.logger.trace('File Read Successful', fileName);
        try {
          const newConfig = JSON.parse(data.toString());
          this.logger.trace('JSON.parse successful', newConfig);
          return resolve(newConfig);
        } catch (err) {
          this.logger.trace('JSON.parse error', fileName, err.message);
          return resolve(this.levelConfig);
        }
      });
    });
  }

  private async validateConfig(config: LevelConfig): Promise<LevelConfig> {
    return schema
      .validate(config)
      .then(validatedConfig => (validatedConfig ? validatedConfig : this.levelConfig))
      .catch(err => {
        this.logger.trace('Schema Validation Error', err.message);
        return this.levelConfig;
      });
  }
}
