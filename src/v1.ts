import { PSocketServer } from "./PSocketServer";
import {
  BODY_TOO_LARGE,
  INVALID_FORMAT,
  INVALID_HEADERS,
  INVALID_ID,
  INVALID_METHOD,
  INVALID_TYPE,
  INVALID_URL
} from "./errors";
import { PSocketRequest } from "./types/PSocket";
import { WebSocket } from "ws";

async function requestResource(self: PSocketServer, request: PSocketRequest) {}

export function connect(self: PSocketServer, client: WebSocket) {
  client.on("message", (data: Buffer, isBinary: boolean) => {
    if (!isBinary) {
      try {
        const request = JSON.parse(data.toString("utf-8")) as PSocketRequest;

        if (!/^$[0-9a-f]{32}$/.test(request.id)) {
          client.send(JSON.stringify(INVALID_ID), { binary: false });
          return;
        }

        switch (request.type) {
          case "request":
            // Validate request
            if (!isURL(request.url)) {
              client.send(formatError(INVALID_URL, request.id), {
                binary: false
              });
              return;
            }

            if (
              !/^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)$/.test(
                request.method
              )
            ) {
              client.send(formatError(INVALID_METHOD, request.id), {
                binary: false
              });
              return;
            }

            if (!isHeaders(request.headers)) {
              client.send(formatError(INVALID_HEADERS, request.id), {
                binary: false
              });
              return;
            }

            if (request.body && request.body > self.meta.maxBodySize) {
              client.send(formatError(BODY_TOO_LARGE, request.id), {
                binary: false
              });
              return;
            }

            if (typeof request.body === "undefined") {
              requestResource(self, request);
            } else {
              // TODO: queue body
            }

            break;
          default:
            client.send(formatError(INVALID_TYPE, request.id), {
              binary: false
            });
            break;
        }
      } catch {
        client.send(formatError(INVALID_FORMAT), { binary: false });
      }
    } else {
      const id = data.subarray(0, 16).toString("hex");
      const index = ((data[16] & 0xff) << 8) | (data[17] & 0xff);

      console.log(id, index);
    }
  });
}

function formatError(error: any, id?: string): string {
  return JSON.stringify({
    id,
    type: "error",
    ...error
  });
}

function isURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isHeaders(headers: HeadersInit): boolean {
  try {
    new Headers(headers);
    return true;
  } catch {
    return false;
  }
}

// const ws = new WebSocket("ws://localhost:8080/v1/");

// ws.onopen = () => {
//   const id = "ed9e883b6bd9484e836c53c245e8658a";
//   const index = 300;

//   ws.send(
//     new Uint8Array([
//       ...id.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
//       ...[(index >> 8) & 0xff, index & 0xff]
//     ])
//   );
// };
