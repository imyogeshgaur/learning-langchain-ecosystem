import express from "express";
import getResultAsStream from "./agents/langchain/streams.js";
import { resolve } from "path";
import "./agents/langraph/basic.js"


// const app = express();
// const httpPort = 3000;

// app.use(express.json());
// app.use(express.static(resolve(process.cwd(), "src/template")));

// app.post("/chat", async (req, res) => {
//   const userInput = req.body?.userInput;
//
//   const response = await responseFromOllama(userInput);
//   return res.json({ response });
// });
//
// app.post("/chat-with-tool", async (req, res) => {
//   const userInput = req.body?.userInput;
//   const { default: invokeChatWithTool } = await import("./agents/chatWithTool.js");
//   const response = await invokeChatWithTool(userInput);
//   return res.json({ response });
// });

// app.post("/chat-with-stream", async (req, res) => {
//   const userInput = req.body?.userInput;
//   if (typeof userInput !== "string" || !userInput.trim()) {
//     res.status(400).json({ error: "userInput must be a non-empty string." });
//     return;
//   }

//   res.status(200);
//   res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
//   res.setHeader("Cache-Control", "no-cache, no-transform");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   try {
//     const streamOutput = await getResultAsStream(userInput.trim());
//     for await (const message of streamOutput.messages) {
//       for await (const token of message.text) {
//         res.write(`data: ${JSON.stringify({ token })}\n\n`);
//       }
//     }
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Unknown server error.";
//     console.error("Streaming chat failed:", error);
//     if (!res.destroyed) {
//       res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
//     }
//   } finally {
//     if (!res.destroyed) res.end();
//   }
// });

// app.listen(httpPort, () => {
//   console.log(`Server is running at http://localhost:${httpPort}`);
// });