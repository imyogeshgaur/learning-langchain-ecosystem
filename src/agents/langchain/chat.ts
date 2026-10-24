import { ollamaLlm } from "../config/config.js";

export const responseFromOllama = async (userMessage: string) => {
  const response = await ollamaLlm.invoke(userMessage);
  return response.additional_kwargs.reasoning_content;
}