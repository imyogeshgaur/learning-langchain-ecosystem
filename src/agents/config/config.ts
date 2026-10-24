import { ChatOllama } from "@langchain/ollama";
export const ollamaLlm = new ChatOllama({
  model: 'gemma4:12b-mlx',
  baseUrl: 'http://localhost:11434',
})
