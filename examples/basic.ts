import { PSocketServer } from "@proxysocket/server-node";

const server = new PSocketServer();

await server.listen(8080);
