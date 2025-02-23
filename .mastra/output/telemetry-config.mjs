import '@mastra/core';
import { z } from 'zod';
import { Workflow, Step } from '@mastra/core/workflows';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { ElevenLabsClient } from 'elevenlabs';

const openaiModel$2 = openai("o3-mini", {
  reasoningEffort: "high"
});
const scriptGenerator = new Agent({
  name: "script-generator",
  model: openaiModel$2,
  instructions: `You are a script generator. You are given a user input and you need to generate a script that dives deep into the user's input/topic of choice.`
});

const openaiModel$1 = openai("o3-mini", {
  reasoningEffort: "high"
});
const scriptChaptersGenerator = new Agent({
  name: "script-chapters-generator",
  model: openaiModel$1,
  instructions: `You are a script outline generator. Given a topic or input, you need to generate a list of chapters that are relevant for a deep dive into the topic.`
});

const openaiModel = openai("o3-mini", {
  reasoningEffort: "low"
});
const scriptEditor = new Agent({
  name: "script-editor",
  model: openaiModel,
  instructions: `You are a script editor. You are given a script and you will edit it based on the instructions given.`
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const MAX_CHUNK_LENGTH = 2500;
const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY
});
const voiceId = "1SM7GgM6IMuvQlz2BwM3";
const splitTextIntoChunks = (text) => {
  const chunks = [];
  let currentChunk = "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > MAX_CHUNK_LENGTH) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
};
const createAudioFileFromText = async (text) => {
  try {
    const textChunks = splitTextIntoChunks(text);
    const audioChunks = [];
    for (const chunk of textChunks) {
      const audio = await client.textToSpeech.convert(voiceId, {
        text: chunk,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128"
      });
      const chunks = [];
      for await (const chunk2 of audio) {
        chunks.push(chunk2);
      }
      audioChunks.push(Buffer.concat(chunks));
    }
    const finalAudioBuffer = Buffer.concat(audioChunks);
    const fileName = `${Date.now()}.mp3`;
    await Bun.write(fileName, finalAudioBuffer);
    return fileName;
  } catch (error) {
    throw error;
  }
};

const logger = {
  log: (message) => {
    console.log(message);
  }
};
const myWorkflow = new Workflow({
  name: "my-workflow",
  triggerSchema: z.object({
    userInput: z.string(),
    length: z.number().optional().default(1e3),
    style: z.enum(["formal", "casual", "technical", "humorous", "poetic"]).optional().default("formal")
  })
});
const scriptChaptersGeneratorStep = new Step({
  id: "scriptChaptersGeneratorStep",
  outputSchema: z.object({
    chapters: z.array(z.string())
  }),
  inputSchema: z.object({
    userInput: z.string()
  }),
  execute: async ({ context }) => {
    logger.log("Generating script chapters...");
    const input = context?.getStepPayload("trigger");
    if (!input) throw new Error("Input is required");
    const prompt = `
    

    Generate a list of chapters for a deep dive into the topic.
    
    - The chapters should be relevant to the topic.
    - The chapters should be numbered.
    - The chapters should be concise and to the point.
    - The chapters should be written in a way that is easy to understand.
    - The chapters should be written in a way that is engaging and interesting.
    
    Topic:${input.userInput}`;
    const res = await scriptChaptersGenerator.generate(prompt, {
      output: z.object({
        chapters: z.array(z.string())
      })
    });
    return { chapters: res.object.chapters };
  }
});
const generateScriptStep = new Step({
  id: "generateScriptStep",
  outputSchema: z.object({
    script: z.string()
  }),
  inputSchema: z.object({
    chapters: z.array(z.string())
  }),
  execute: async ({ context }) => {
    logger.log("Generating script...");
    const input = context?.getStepPayload("trigger");
    const chapters = context?.getStepPayload("scriptChaptersGeneratorStep")?.chapters;
    if (!input) throw new Error("Input is required");
    const prompt = `Generate a script for a deep dive based on the outline of the chapters below.
    
    Chapters: ${chapters?.join("\n")}

    - The script should be ${input.length} words long.
    - The script should be written in ${input.style} style.
    - The script should not contain timestamps or timecodes for when things should be said.
    - The script should not contain any other text than the script.
    - Use newlines to separate the script into paragraphs and sections with titles.
        For example:
        """
          - Chapter 1

          This is the first chapter.

          - Chapter 2

          This is the second chapter.
        """
    - You are writing for a single person to listen to.
    `;
    const res = await scriptGenerator.generate(prompt, {
      output: z.object({
        script: z.string()
      })
    });
    return { script: res.object.script };
  }
});
const scriptEditorStep = new Step({
  id: "scriptEditorStep",
  outputSchema: z.object({
    script: z.string()
  }),
  inputSchema: z.object({
    script: z.string()
  }),
  execute: async ({ context }) => {
    logger.log("Editing script...");
    const script = context?.getStepPayload("generateScriptStep")?.script;
    if (!script) throw new Error("Script is required");
    const prompt = `Edit the script to make it more engaging and interesting for the user and their needs.
    
    Script: ${script}

    - The script is targeted to a single person to listen to.
    - The script should be written in a way that is engaging and interesting.
    - Focus on the writing style and the tone of the script, not the structure.
    `;
    const res = await scriptEditor.generate(prompt, {
      output: z.object({
        script: z.string()
      })
    });
    return { script: res.object.script };
  }
});
const audioGeneratorStep = new Step({
  id: "audioGeneratorStep",
  outputSchema: z.object({
    success: z.boolean()
  }),
  inputSchema: z.object({
    script: z.string()
  }),
  execute: async ({ context }) => {
    logger.log("Generating audio...");
    const script = context?.getStepPayload(
      "scriptEditorStep"
    )?.script;
    if (!script) throw new Error("Script is required");
    await createAudioFileFromText(script);
    return { success: true };
  }
});
myWorkflow.step(scriptChaptersGeneratorStep).then(generateScriptStep).then(scriptEditorStep).then(audioGeneratorStep).commit();

const telemetry = {};

export { telemetry };
