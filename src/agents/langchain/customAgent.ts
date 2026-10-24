import * as z from "zod";
import { uuid7 } from "langsmith";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent, tool } from "langchain";
import { ollamaLlm } from "../config/config.js";
import fs from "fs";
import path from "path";

const getUserName = tool(
  (_, config) => {
    return config.context.user_data;
  },
  {
    name: "get_user",
    description: "Get the user's information.",
    schema: z.object({}),
  },
);

const contextSchema = z.object({
  user_data: z.string(),
});

const agent = createAgent({
  model: ollamaLlm,
  tools: [getUserName],
  checkpointer: new MemorySaver(),
  contextSchema,
});

const filePath = path.join(process.cwd(), "./src/agents/user_data.md");
const userData = fs.readFileSync(filePath, "utf-8");

const threadId = uuid7();
const threadConfig = {
  configurable: { thread_id: threadId },
  context: { user_data: userData },
};

let result = await agent.invoke(
  {
    messages: [{ role: "user", content: "What is my name?" }],
  },
  threadConfig,
);
console.log(result.messages.at(-1)?.content);

result = await agent.invoke(
  {
    messages: [{ role: "user", content: "What is my university name?" }],
  },
  threadConfig,
);
console.log(result.messages.at(-1)?.content);

result = await agent.invoke(
  {
    messages: [{ role: "user", content: "What is my cgpa?" }],
  },
  threadConfig,
);

console.log(result.messages.at(-1)?.content);