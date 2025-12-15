// api/index.ts
import { app } from "../app"; // app deve ser compilado para dist via tsc

export default async function handler(req: any, res: any) {
  await app.ready();
  app.server.emit("request", req, res);
}
