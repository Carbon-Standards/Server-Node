import { CarbonMeta } from "@carbon-standards/types";
import { version } from "../package.json";
import { createServer, Server, ServerResponse } from "http";
import { Duplex } from "stream";

export type CarbonServerOptions = {
  versions: CarbonMeta["versions"];
  requestTimeout: CarbonMeta["requestTimeout"];
  maxBodySize: CarbonMeta["maxBodySize"];
  maxMessageSize: CarbonMeta["maxMessageSize"];
  maxPacketSize: CarbonMeta["maxPacketSize"];
  maintainer: CarbonMeta["maintainer"];
};

export class CarbonServer {
  meta: CarbonMeta;
  http: Server;

  constructor(options: Partial<CarbonServerOptions>, server?: Server) {
    // Create the meta object
    this.meta = {
      versions: options.versions || [1],
      requestTimeout: options.requestTimeout || 10000,
      maxBodySize: Math.max(options.maxBodySize || 1024 * 1024 * 10, 1024),
      maxMessageSize: Math.max(
        options.maxMessageSize || 1024 * 1024 * 10,
        1024
      ),
      maxPacketSize: Math.max(options.maxPacketSize || 1024 * 1024, 1024),
      project: {
        name: "Server Node",
        repository: "https://github.com/Carbon-Standards/Server-Node",
        version
      }
    };

    this.http = server || createServer();
    this.http.on("request", this.request.bind(this));
    this.http.on("upgrade", this.upgrade.bind(this));
  }

  private request(request: Request, response: ServerResponse) {
    if (request.url === "/") {
      response.writeHead(200, {
        "Content-Type": "application/json"
      });
      response.end(JSON.stringify(this.meta, null, "\t"));
    } else {
      response.writeHead(404);
      response.end("Not found.");
    }
  }

  private upgrade(request: Request, socket: Duplex, head: Buffer) {
    if (/^\/v1\/?$/.test(request.url)) {
      // Upgrade socket to v1 client
    }

    socket.destroy();
  }
}
