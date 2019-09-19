[![Build Status](https://travis-ci.org/MotorolaSolutions/pino-lombokish.svg?branch=master)](https://travis-ci.org/MotorolaSolutions/pino-lombokish)

# Pino Lombok(ish)

Lombok(ish) wrapper which allows for simple pino logger creation as class member (or module variable)

Also Implements [NestJS](https://nestjs.com/) interface.

## Installation

```
npm i -s pino-lombokish
npm i -D @types/pino @types/pino-http pino-pretty
```

> **Note** pino-pretty can be installed as dev dependency if needed

> **Important!** `experimentalDecorators`, `emitDecoratorMetadata`, `strictPropertyInitialization` compilation options in your `tsconfig.json` file.

```
{
  "compilerOptions" : {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  }
}
```

## Usage

### **Important!** Execute "forRoot()" AT THE VERY BEGINNING OF YOUR APP (EVEN BEFORE OTHER IMPORTS)

```typescript
// main.ts
import { LoggerFactory } from 'pino-lombokish';
LoggerFactory.forRoot({
  level: 'info', // trace | debug | info | warn | error | fatal
  name: 'YourAppName' // optional
});

import { foo }
```

### Inside ts/js file

```typescript
// file.ts
import { LoggerFactory } from 'pino-lombokish';

const logger = LoggerFactory.createLogger();
logger.info('Will log "className": "file.ts" in Your Log');
```

### With Provided class name

```typescript
// file.ts
import { LoggerFactory } from 'pino-lombokish';

const logger = LoggerFactory.createLogger('foo');
logger.info('Will log "className": "foo" in Your Log');
```

### As class member (Lombok'ish style)

```typescript
// foo.ts
import { Logger, AppLogger } from 'pino-lombokish';

export class Foo {
  @Logger()
  private logger: AppLogger;

  @Logger()
  private anotherLogger: any;

  constructor() {
    this.logger.info('Will log "className": "Foo" in Your log');
    this.anotherLogger.info('Will log "className": "Foo" in Your log');
  }
}
```

## HTTP Middleware.

Creates [Pino Http](https://www.npmjs.com/package/pino-http) NodeJS/express middleware

```typescript
import { LoggerFactory } from 'pino-lombokish';
import { LoggerOptions } from 'pino';

const config: LoggerOptions = {
  level: 'debug',
  name: 'YourApp'
};
LoggerFactory.forRoot(config);

// NOTE: Import other modules using Logger after calling LoggerFactory.forRoot()
import { Foo } from './foo';

import * as express from 'express';
const app = express();
app.use(LoggerFactory.createHttpLoggerMiddleware(config));
app.listen(3000);
```

> **Note** HTTP Middleware class name is hard coded to 'http'

### By Default HTTP Logger Logs any request containing "_/health_" as TRACE

To Get rid of Kubernetes Health check logs

### By Default HTTP Logger will redact

1. HTTP Headers (via pino redact option)

   - Authorization
   - x-original-uri
   - x-original-url

2. HTTP URL Parameters (via pino http serializers option)
   - access_token

### HTTP Configuration can be overriden by user. Simply call function with own provided config

```typescript
import { LoggerOptions } from 'pino';
import { Options } from 'pino-http';
const pinoConfig: LoggerOptions = {
  level: 'warn',
}

const pinoHttpOptions: Options: {
  customLogLevel: customLogLevelFn,
  serializers: { req: customReqSerializer }
}

app.use(LoggerFactory.createHttpLoggerMiddleware(pinoConfig, pinoHttpOptions));
```

## Level Changer

The pino-lombokish package implements Level Changer functionality which allows users to change logger level at runtime.

### Configuration

#### `main.ts`

```typescript
import { LoggerFactory, AppLogger, Logger } from '../';

LoggerFactory.forRoot({
  level: 'debug',
  name: 'example',
  changeConfig: {
    path: './levels.json'
  }
});
```

#### `levels.json`

```json
{
  "level": "info", // mandatory
  "levels": {
    // optional if user wants to set level for specific class name
    "example.ts": "warn",
    "LevelChanger": "info",
    "http": "info"
  }
}
```

### **NOTE**

- If provided file does not exist Level Changer will check for its existence every 10s.
- Once the file is created Level Changer will subscribe to its changes
- When the file is removed Level Changer will start checking for its existence every 10s (again)

## Acknowledgements

- [Pino Logger](https://getpino.io)
- [Project Lombok](https://projectlombok.org/)
- [V8 Stack trace API](https://v8.dev/docs/stack-trace-api)
- [Node Watch](https://www.npmjs.com/package/node-watch)
- [Reflect Metadata](https://www.npmjs.com/package/reflect-metadata)

## License

The [MIT License](http://opensource.org/licenses/MIT)

Copyright (C) 2019 Motorola Solutions, Inc
All rights reserved
