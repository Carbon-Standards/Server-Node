import { Server } from "http";
import { WebSocketServer } from "ws";

export type PSocketServerOptions = {
  prefix?: `/${string}/` | "/";
  maintainer?: {
    email: string;
    website: string;
  };
  requestTimeout?: number;
  maxBodySize?: number;
  maxPacketSize?: number;
  server?: Server;
  wss?: WebSocketServer;
};

export type PSocketMeta = {
  /**
   * Versions that are provided by the given PSocket server.
   */
  versions: number[];
  /**
   * The request timeout value set by the server, this value should be identical between client and server pairs.
   */
  requestTimeout: number;
  /**
   * The maximum body size in bytes allowed by the server. If either request or response body exceeds this limit, the server will respond with an error.
   */
  maxBodySize: number;
  /**
   * The maximum packet size in bytes allowed by the server. If any packet exceeds this limit, the server will respond with an error.
   */
  maxPacketSize: number;
  /**
   * Contact information about the maintainer of the given PSocket server.
   *
   * Can be used to contact maintainers about security vulnerabilities.
   */
  maintainer?: {
    email: string;
    website: string;
  };
  /**
   * Meta data about the current implementation.
   *
   * Can be used to identify vulnerable servers.
   */
  project: {
    name: string;
    description?: string;
    email?: string;
    website?: string;
    repository?: string;
    version: string;
  };
};

export type PSocketRequest = {
  /**
   * A 32 character HEX string identifying the request.
   *
   * This should be randomly generated uppon each request in order to ensure there are no response collisions.
   * If this isn't set, the server will respond with an error.
   */
  id: string;
  /**
   * This value is used by the server to determine what kind of action is being completed.
   *
   * This value may be one of three different values for requests and responses.
   *
   * `"request" | "response" | "error"`
   */
  type: "request";
  /**
   * A string to set request's method.
   *
   * If an invalid HTTP method is provided, the server will respond with an error.
   */
  method: string;
  /**
   * The remote URL.
   *
   * If this isn't set, the server will respond with an error.
   */
  url: string;
  /**
   * Headers to be sent to the remote.
   *
   * Note that no other headers apart from what is specified here will be sent to the remote.
   */
  headers: Record<string, string>;
  /**
   * An integer value representing the size of the body in bytes.
   *
   * If set, the server will wait for the full body to be recieved before making any requests.
   */
  body?: number;
};

export type PSocketResponse = {
  /**
   * The 32 character HEX string identifying the response.
   *
   * This id represents which `PSocketRequest` the given response corelates to.
   */
  id: string;
  /**
   * This value is used by the client to determine what kind of action is being completed.
   */
  type: "response";
  /**
   * The final URL provided by the response.
   *
   * This may differ from the request URL if the server redirected the request.
   */
  url: string;
  /**
   * The HTTP status code provided by the remote resource.
   */
  status: number;
  /**
   * The response headers provided by the remote.
   */
  headers: Record<string, string>;
  /**
   * An integer value representing the size of the body in bytes.
   *
   * If set, the client will wait for the full body to be recieved before finalizing any requests.
   */
  body?: number;
};
