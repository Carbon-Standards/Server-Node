# PSocket Server Node

[PSocket specifications](https://github.com/P-Socket/Specifications) implemented in NodeJS.

## Install

```bash
npm install @psocket/server-node
```

## Running a Server

```ts
import { PSocketServer } from "@psocket/server-node";

const server = new PSocketServer();

await server.listen(8080);
```
