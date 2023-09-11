import { ServerResponse } from "http";

export function json(res: ServerResponse, json: any) {
  res.setHeader("Content-type", "application/json");
  res.write(JSON.stringify(json, null, 2));
  res.end();
}
