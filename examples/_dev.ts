import { PSocketServer } from "../src";

const server = new PSocketServer({
  maxPacketSize: 512
});

await server.listen(8080);
