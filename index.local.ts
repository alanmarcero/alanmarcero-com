import { handler } from "./index";
import type { LambdaEvent } from "./index";

async function main() {
  const event: LambdaEvent = {
    httpMethod: "GET",
    path: "/",
  };

  const result = await handler(event);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
