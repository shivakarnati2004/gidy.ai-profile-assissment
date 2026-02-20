import { env } from "./lib/env";
import app from "./app";

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
