import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

const openaiModel = openai("o3-mini", {
  reasoningEffort: "low",
});

export const scriptEditor = new Agent({
  name: "script-editor",
  model: openaiModel,
  instructions: `You are a script editor. You are given a script and you will edit it based on the instructions given.`,
});
