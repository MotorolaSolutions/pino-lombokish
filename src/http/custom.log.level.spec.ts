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

import { customLogLevel } from './custom.log.level';
import * as pino from 'pino';
const chindingsSym = (pino as any).symbols.chindingsSym;

describe('Custom Log Level for /health paths', () => {
  it('Should return "info" when res.log is not defined', done => {
    const res: any = {};
    const err: any = {};
    expect(customLogLevel(res, err)).toEqual('info');
    done();
  });

  it('Should return "trace" when request path contains /health', done => {
    const log: any = {};
    log[chindingsSym] = '"req": { "url": "/health/readiness" }';
    const res: any = { log };
    const err: any = {};
    expect(customLogLevel(res, err)).toEqual('trace');
    done();
  });

  it('Should return info when request path does not contain /health', done => {
    const log: any = {
      level: 'warn'
    };
    log[chindingsSym] = '"req": { "url": "/api/v1/someApi" }';
    const res: any = { log };
    const err: any = {};
    expect(customLogLevel(res, err)).toEqual('info');
    done();
  });
});
