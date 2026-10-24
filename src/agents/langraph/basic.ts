import { SystemMessage } from "@langchain/core/messages";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { tool } from "langchain";
import z from "zod";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { ollamaLlm } from "../config/config.js";

const numberPairSchema = z.object({
  a: z.number().describe("The first number."),
  b: z.number().describe("The second number."),
});

const additionTool = tool(({ a, b }) => {
  console.log(`Step: Adding ${a} and ${b}`);
  return a + b
}, {
  name: "add_tool",
  description: "Add two numbers.",
  schema: numberPairSchema,
});

const subtractionTool = tool(({ a, b }) => {
  console.log(`Step: Substracing  ${a} from ${b}`);
  return a - b
}, {
  name: "sub_tool",
  description: "Subtract the second number from the first number.",
  schema: numberPairSchema,
});

const multiplicationTool = tool(({ a, b }) => {
  console.log(`Step: Multiplying ${a} with ${b}`);
  return a * b
}, {
  name: "mult_tool",
  description: "Multiply two numbers.",
  schema: numberPairSchema,
});

const rl = readline.createInterface({
  input,
  output,
});

const tools = [additionTool, subtractionTool, multiplicationTool];
const checkpointer = new MemorySaver();

const modelWithTools = ollamaLlm.bindTools(tools);

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => {
    const response = await modelWithTools.invoke([
      new SystemMessage(
        "You are a calculator assistant. For addition, subtraction, or multiplication, call the matching tool with the two numbers. Use the tool result to answer. Do not calculate these operations yourself."
      ),
      ...state.messages,
    ]);
    return { messages: [response] };
  })
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition, ["tools", END])
  .addEdge("tools", "agent")
  .compile({ checkpointer });

async function startChat(): Promise<void> {
  try {
    while (true) {
      const userInput = (await rl.question("You: ")).trim();

      if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "bye") {
        console.log("AI: Goodbye!");
        break;
      }

      if (!userInput) continue;

      const response = await graph.invoke(
        { messages: [{ role: "human", content: userInput }] },
        { configurable: { thread_id: "calculator-chat" } }
      );
      const lastMessage = response.messages.at(-1);
      console.log("AI:", lastMessage?.content ?? "No response returned.");
    }
  } finally {
    rl.close();
  }
}

startChat().catch((error: unknown) => {
  console.error("Chat failed:", error);
  process.exitCode = 1;
});