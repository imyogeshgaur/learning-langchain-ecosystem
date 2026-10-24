import { MemorySaver } from "@langchain/langgraph";
import { createAgent } from "langchain";
import { ollamaLlm } from "../config/config.js";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { v7 } from "uuid";

const memory = new MemorySaver();
const agent = createAgent({
  model: ollamaLlm,
  checkpointer: memory,
  systemPrompt: "You are an helpful personal agent who greet well to user when they first time interact with you with good morning/afternoon/evening as per local time"
});

const threadId = v7();

const threadConfig = { configurable: { thread_id: "srverb" } };

const rl = readline.createInterface({
  input: input,
  output: output,
});

async function startChat(threadId: string) {
  console.log("Chat started! Type 'exit' to stop.\n");

  let continueChat = true;

  while (continueChat) {
    const userInput = await rl.question("You: ");

    if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
      continueChat = false;
      console.log("Goodbye!");
      rl.close();
      break;
    }

    const response: any = await agent.invoke(
      { messages: [{ role: "human", content: userInput }] },
      threadConfig
    );

    console.log(`\nAI: The response for id ${threadId} is ${response.messages.at(-1).content}\n`);
  }
}

startChat(threadId);
