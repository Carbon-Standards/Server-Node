import { PSocketServer } from "./PSocketServer";
import {
  BODY_TIMEOUT,
  BODY_TOO_LARGE,
  INVALID_FORMAT,
  INVALID_HEADERS,
  INVALID_ID,
  INVALID_METHOD,
  INVALID_TYPE,
  INVALID_URL,
  REQUEST_NOT_FOUND
} from "./errors";
import { PSocketRequest, PSocketResponse } from "./types/PSocket";
import { WebSocket } from "ws";

const META_BYTES = 18;

const bodyQueue = new Map<
  string,
  {
    request?: PSocketRequest;
    chunks: ArrayBuffer[];
    timeout: NodeJS.Timeout;
  }
>();

async function requestResource(
  self: PSocketServer,
  client: WebSocket,
  pRequest: PSocketRequest
) {
  const request = new Request(pRequest.url, {
    method: pRequest.method,
    headers: pRequest.headers
  });

  const response = await fetch(request);

  const pResponse: PSocketResponse = {
    id: pRequest.id,
    type: "response",
    url: response.url,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries())
  };

  let body: ArrayBuffer | undefined;

  if (response.body) {
    body = await response.arrayBuffer();

    pResponse.body = body.byteLength;

    if (body.byteLength > self.meta.maxBodySize) {
      client.send(formatError(BODY_TOO_LARGE, pRequest.id), {
        binary: false
      });
      return;
    }
  }

  client.send(JSON.stringify(pResponse), { binary: false });

  if (body !== undefined) {
    const usableBytes = self.meta.maxPacketSize - META_BYTES;
    const packets = Math.ceil(body.byteLength / usableBytes);

    for (let i = 0; i < packets; i++) {
      client.send(
        new Uint8Array([
          // ID
          ...pRequest.id.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
          // Index
          ...[(i >> 8) & 0xff, i & 0xff],
          // Body
          ...new Uint8Array(body.slice(i * usableBytes, (i + 1) * usableBytes))
        ]),
        { binary: true }
      );
    }
  }
}

export function connect(self: PSocketServer, client: WebSocket) {
  client.on("message", (data: Buffer, isBinary: boolean) => {
    console.log(data.toString());
    if (!isBinary) {
      try {
        const request = JSON.parse(data.toString("utf-8")) as PSocketRequest;

        if (!/^[0-9a-f]{32}$/.test(request.id)) {
          client.send(formatError(INVALID_ID, request.id), { binary: false });
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
              requestResource(self, client, request);
            } else {
              const timeout = setTimeout(() => {
                client.send(formatError(BODY_TIMEOUT, request.id), {
                  binary: false
                });
                bodyQueue.delete(request.id);
              }, self.meta.requestTimeout);

              bodyQueue.set(request.id, {
                request,
                chunks: [],
                timeout
              });
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
      // const index = ((data[16] & 0xff) << 8) | (data[17] & 0xff);

      const queuedBody = bodyQueue.get(id);
      const chunks = [...(queuedBody?.chunks ?? []), data];

      if (queuedBody && queuedBody.request && queuedBody.request.body) {
        bodyQueue.set(id, {
          request: queuedBody.request,
          chunks,
          timeout: queuedBody.timeout
        });

        if (chunks.length === queuedBody.request.body) {
          clearTimeout(queuedBody.timeout);

          // TODO: Request resource with body
        }
      } else {
        client.send(formatError(REQUEST_NOT_FOUND), { binary: false });
      }
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
// const utf = new TextDecoder("utf-8");

// ws.onopen = () => {
//   ws.send(
//     JSON.stringify({
//       id: "becae8792e5a4888a49fbdb5f8be8207",
//       type: "request",
//       url: "https://example.com/",
//       method: "GET",
//       headers: {}
//     })
//   );
// };

// ws.onmessage = async ({ data }) => {
//   try {
//     console.log(JSON.parse(data));
//   } catch {
//     data = new Uint8Array(await data.arrayBuffer());

//     const id = Array.from(data.slice(0, 16))
//       .map((byte) => byte.toString(16).padStart(2, "0"))
//       .join("");
//     const index = ((data[16] & 0xff) << 8) | (data[17] & 0xff);
//     const body = utf.decode(data.slice(18));
//     console.log([id, index, body]);
//   }
// };
