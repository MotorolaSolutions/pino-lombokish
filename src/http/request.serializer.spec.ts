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

import { requestSerializer } from './request.serializer';
describe('Request Serializer', () => {
  it('Should not execute when req is not defined', done => {
    expect(requestSerializer(undefined)).toBeUndefined();
    done();
  });

  it('Should return original req when no url specified', done => {
    const req: any = {};
    expect(requestSerializer(req)).toEqual(req);
    done();
  });

  it('Should not modify request when there is no access_token param', done => {
    const req: any = {
      url: '/?foo=bar'
    };
    expect(requestSerializer(req)).toEqual(req);
    done();
  });

  it('Should replace access_token when present in params', done => {
    const url = '/?access_token=1234&foo=bar';
    const redacted = '/?access_token=*****&foo=bar';

    const req: any = {
      url
    };

    const reqAfter = requestSerializer(req);

    expect(reqAfter).toBeDefined();
    expect(reqAfter!.url).toEqual(redacted);
    done();
  });

  it('Should return original request when URL parsing failed', done => {
    const req: any = {
      url: '////'
    };

    expect(requestSerializer(req)).toEqual(req);
    done();
  });
});
