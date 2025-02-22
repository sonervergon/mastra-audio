import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

const gemini = google("gemini-1.5-flash");

export const scriptGenerator = new Agent({
  name: "script-generator",
  model: gemini,
  instructions: `You are a script generator. You are given a user input and you need to generate a script that dives deep into the user's input/topic of choice.`,
});
