import { handler } from "./lambda";
import type { APIGatewayEvent } from "aws-lambda";

async function main() {
  const event: Partial<APIGatewayEvent> = {
    httpMethod: "GET",
    path: "/",
  };

  const result = await handler(event as APIGatewayEvent);
  console.log(result);
}

main().catch(console.error);