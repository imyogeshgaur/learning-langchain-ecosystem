import { createAgent, tool, toolStrategy } from "langchain"
import z from "zod"
import { ollamaLlm } from "../config/config.js";
import axios from "axios";

const calculator = tool(({ a, b, c }) => {
  switch (c) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      return a / b;
    default:
      return "Invalid operation";
  }
}, {
  name: "calculator",
  description: "Perform basic arithmetic operations (add, subtract, multiply, divide) on two numbers.",
  schema: z.object({
    a: z.number().describe("The first number."),
    b: z.number().describe("The second number."),
    c: z.enum(["add", "subtract", "multiply", "divide"]).describe("The operation to perform."),
  }),
})

const getGithubUserData = tool(async (username: string) => {
  const response = await axios.get(`https://api.github.com/users/${username}`);
  return response.data;
}, {
  name: "get_github_user_data",
  description: "Get the user's information from GitHub.",
  schema: z.string().describe("The GitHub username."),
})

const responseFormat = z.object({
  answer: z.string().describe("The answer to the user's question."),
  reasoning: z.string().describe("The reasoning behind the answer."),
});

const agent = createAgent({
  tools: [calculator, getGithubUserData],
  model: ollamaLlm,
  systemPrompt: `
      You are a helpful assistant.
      For Questions realted to calculations, 
      use the calculator tool to perform the calculations and provide the answer.
      For questions not related to mathematics, 
      answer helpfully and set reasoning to null. 
      For questions related to GitHub user data, use the get_github_user_data tool to fetch the user's information and provide the answer and keep reasoning as null.
      Always return the result using the structured-output tool, 
      with exactly the fields answer and reasoning. 
      The answer must be a string; reasoning must be a string for mathematics questions and null for all other questions.
  `,
  responseFormat: toolStrategy(responseFormat)
})

const invokeChatWithTool = async (userInput: string) => {
  const response: any = await agent.invoke({ messages: [{ role: "user", content: userInput }] });
  const messages: any[] = response.messages ?? [];
  const getMessageName = (message: any) =>
    message.name ?? message.kwargs?.name;
  const getMessageContent = (message: any) =>
    message.content ?? message.kwargs?.content;
  const omitEmptyReasoning = (result: any) => {
    if (!result || typeof result !== "object" || result.reasoning != null) {
      return result;
    }
    const { reasoning, ...answer } = result;
    return answer;
  };

  const githubToolMessage = messages.find(
    (message) => getMessageName(message) === "get_github_user_data",
  );
  if (githubToolMessage) {
    const content = getMessageContent(githubToolMessage);
    return typeof content === "string" ? JSON.parse(content) : content;
  }

  const calculatorToolMessage = messages.find(
    (message) => getMessageName(message) === "calculator",
  );
  if (response.structuredResponse) {
    return omitEmptyReasoning(response.structuredResponse);
  }

  const answerToolCall = [...messages]
    .reverse()
    .flatMap((message) => message.tool_calls ?? message.kwargs?.tool_calls ?? [])
    .find((toolCall: any) => typeof toolCall.args?.answer === "string");
  if (answerToolCall) {
    return omitEmptyReasoning(answerToolCall.args);
  }

  if (calculatorToolMessage) {
    const answer = getMessageContent(calculatorToolMessage);
    return { answer };
  }

  const finalAssistantMessage = [...messages]
    .reverse()
    .find((message) => {
      const messageType = message.type ?? message.id?.[2];
      return messageType === "ai" || messageType === "AIMessage";
    });
  if (finalAssistantMessage) {
    const content = getMessageContent(finalAssistantMessage);
    if (typeof content === "string" && content.length > 0) {
      return { answer: content };
    }
  }

  throw new Error("The agent response did not contain an answer.");
}

export default invokeChatWithTool;