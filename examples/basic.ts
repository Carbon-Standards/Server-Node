import { PSocketServer } from "@psocket/server-node";

const server = new PSocketServer();

await server.listen(8080);
