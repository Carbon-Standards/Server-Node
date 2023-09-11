import * as pkg from "../package.json";
import { METHOD_NOT_ALLOWED, NOT_FOUND } from "./errors";
import { json } from "./responseUtil";
import { PSocketMeta, PSocketServerOptions } from "./types/PSocket";
import * as v1 from "./v1";
import http, { IncomingMessage, ServerResponse, Server } from "node:http";
import { Duplex } from "node:stream";
import { WebSocketServer } from "ws";

const versions = {
  v1
} as const;

export class PSocketServer {
  wss: WebSocketServer;
  server: Server;
  meta: PSocketMeta;
  prefix: string;
  VERSION_REGEX: RegExp;

  constructor(options?: PSocketServerOptions) {
    this.prefix = options?.prefix ?? "/";
    this.VERSION_REGEX = new RegExp(
      `^${this.prefix}(?<version>${Object.keys(versions).join("|")})/?$`
    );

    if (options?.wss) {
      this.wss = options.wss;
    } else {
      this.wss = new WebSocketServer({ noServer: true });
    }

    if (options?.server) {
      this.server = options.server;
    } else {
      this.server = http.createServer();
    }

    this.meta = {
      versions: [1],
      requestTimeout: options?.requestTimeout ?? 30000,
      maxBodySize: options?.maxBodySize ?? 68718297088,
      maxMessageSize: options?.maxMessageSize ?? 1048558,
      maxPacketSize: options?.maxPacketSize ?? 1048558,
      maintainer: options?.maintainer,
      project: {
        name: pkg.name,
        description: pkg.description,
        repository: pkg.repository,
        version: pkg.version
      }
    };

    this.server.on("request", this.request.bind(this));
    this.server.on("upgrade", this.upgrade.bind(this));
  }

  request(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.statusMessage = "Method Not Allowed";

      json(res, METHOD_NOT_ALLOWED);
    }
    if (req.url === this.prefix) {
      json(res, this.meta);
    } else {
      res.statusCode = 404;
      res.statusMessage = "Not Found";

      json(res, NOT_FOUND);
    }
  }

  upgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    if (this.VERSION_REGEX.test(req.url ?? "/")) {
      const versionStr = req.url?.match(this.VERSION_REGEX)?.groups?.version as
        | keyof typeof versions
        | undefined;

      if (versionStr) {
        const version = versions[versionStr];

        this.wss.handleUpgrade(req, socket, head, async (client) => {
          version.connect(this, client);
        });
      } else {
        socket.end();
      }
    }
  }

  listen(port: number, host?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(port, host, () => {
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
