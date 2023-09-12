export const METHOD_NOT_ALLOWED = {
  code: "METHOD_NOT_ALLOWED",
  key: "request.method",
  message: "Method Not Allowed"
};

export const NOT_FOUND = {
  code: "NOT_FOUND",
  key: "request.url",
  message: "Not Found"
};

export const INVALID_FORMAT = {
  code: "INVALID_FORMAT",
  key: "message.data",
  message: "WebSocket message provided an invalid format"
};

export const INVALID_TYPE = {
  code: "INVALID_TYPE",
  key: "message.data.type",
  message: "Request provided an invalid type"
};

export const INVALID_ID = {
  code: "INVALID_ID",
  key: "message.data.id",
  message: "Request provided an invalid id"
};

export const INVALID_URL = {
  code: "INVALID_URL",
  key: "message.data.url",
  message: "Request provided an invalid URL"
};

export const INVALID_METHOD = {
  code: "INVALID_METHOD",
  key: "message.data.method",
  message: "Request provided an invalid method"
};

export const INVALID_HEADERS = {
  code: "INVALID_HEADERS",
  key: "message.data.headers",
  message: "Request provided an invalid headers object"
};

export const BODY_TOO_LARGE = {
  code: "BODY_TOO_LARGE",
  key: "message.data.body",
  message: "Request provided a body that was too large"
};

export const BODY_TIMEOUT = {
  code: "BODY_TIMEOUT",
  key: "message.data.body",
  message: "Took too long to send body"
};

export const REQUEST_NOT_FOUND = {
  code: "REQUEST_NOT_FOUND",
  key: "message.data.id",
  message: "Request id not found"
};
