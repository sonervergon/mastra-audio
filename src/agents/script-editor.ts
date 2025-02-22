import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

const gemini = google("gemini-1.5-flash");

export const scriptEditor = new Agent({
  name: "script-editor",
  model: gemini,
  instructions: `You are a script editor. You are given a script and you will edit it based on the instructions given.`,
});
