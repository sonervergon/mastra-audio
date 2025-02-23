import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

const openaiModel = openai("o3-mini", {
  reasoningEffort: "high",
});

export const scriptChaptersGenerator = new Agent({
  name: "script-chapters-generator",
  model: openaiModel,
  instructions: `You are a script outline generator. Given a topic or input, you need to generate a list of chapters that are relevant for a deep dive into the topic.`,
});
