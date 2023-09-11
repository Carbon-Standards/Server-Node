import { PSocketServer } from "../src";

const server = new PSocketServer({});

await server.listen(8080);
