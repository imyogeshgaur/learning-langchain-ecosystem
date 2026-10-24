import { createAgent } from "langchain";
import { ollamaLlm } from "../config/config.js";

const agent = createAgent({
  model: ollamaLlm,
  systemPrompt: `You are a helpful agent and response to every user's query if not data you find say "Sorry, I dont have any information" `
})

const getResultAsStream = async (userInput: string) => {
  const stream = await agent.streamEvents({ messages: { role: "human", content: userInput } }, { version: 'v3' });
  return stream;
}

export default getResultAsStream




