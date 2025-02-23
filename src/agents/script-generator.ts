import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

const openaiModel = openai("o3-mini", {
  reasoningEffort: "high",
});

export const scriptGenerator = new Agent({
  name: "script-generator",
  model: openaiModel,
  instructions: `You are a script generator. You are given a user input and you need to generate a script that dives deep into the user's input/topic of choice.`,
});
