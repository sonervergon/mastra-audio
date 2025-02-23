import { z } from "zod";

import { Step, Workflow } from "@mastra/core/workflows";
import {
  scriptGenerator,
  scriptEditor,
  scriptChaptersGenerator,
} from "./agents";
import { createAudioFileFromText } from "./audio-generator";

const logger = {
  log: (message: string) => {
    console.log(message);
  },
};

export const myWorkflow = new Workflow({
  name: "my-workflow",
  triggerSchema: z.object({
    userInput: z.string(),
    length: z.number().optional().default(1000),
    style: z
      .enum(["formal", "casual", "technical", "humorous", "poetic"])
      .optional()
      .default("formal"),
  }),
});

const scriptChaptersGeneratorStep = new Step({
  id: "scriptChaptersGeneratorStep",
  outputSchema: z.object({
    chapters: z.array(z.string()),
  }),
  inputSchema: z.object({
    userInput: z.string(),
  }),
  execute: async ({ context }) => {
    logger.log("Generating script chapters...");
    const input = context?.getStepPayload<{ userInput: string }>("trigger");

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
        chapters: z.array(z.string()),
      }),
    });

    return { chapters: res.object.chapters };
  },
});

const generateScriptStep = new Step({
  id: "generateScriptStep",
  outputSchema: z.object({
    script: z.string(),
  }),
  inputSchema: z.object({
    chapters: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    logger.log("Generating script...");
    const input = context?.getStepPayload<{
      userInput: string;
      length: number;
      style: string;
    }>("trigger");
    const chapters = context?.getStepPayload<{
      chapters: string[];
    }>("scriptChaptersGeneratorStep")?.chapters;

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
        script: z.string(),
      }),
    });
    return { script: res.object.script };
  },
});

const scriptEditorStep = new Step({
  id: "scriptEditorStep",
  outputSchema: z.object({
    script: z.string(),
  }),
  inputSchema: z.object({
    script: z.string(),
  }),
  execute: async ({ context }) => {
    logger.log("Editing script...");
    const script = context?.getStepPayload<{
      script: string;
    }>("generateScriptStep")?.script;
    const userInput = context?.triggerData;

    if (!script) throw new Error("Script is required");

    const prompt = `Edit the script to make it more engaging and interesting for the user and their needs.
    
    Script: ${script}

    - The script is targeted to a single person to listen to.
    - The script should be written in a way that is engaging and interesting.
    - Focus on the writing style and the tone of the script, not the structure.
    `;

    const res = await scriptEditor.generate(prompt, {
      output: z.object({
        script: z.string(),
      }),
    });
    return { script: res.object.script };
  },
});

const audioGeneratorStep = new Step({
  id: "audioGeneratorStep",
  outputSchema: z.object({
    success: z.boolean(),
  }),
  inputSchema: z.object({
    script: z.string(),
  }),
  execute: async ({ context }) => {
    logger.log("Generating audio...");
    const script = context?.getStepPayload<{ script: string }>(
      "scriptEditorStep"
    )?.script;

    if (!script) throw new Error("Script is required");

    await createAudioFileFromText(script);

    return { success: true };
  },
});

myWorkflow
  .step(scriptChaptersGeneratorStep)
  .then(generateScriptStep)
  .then(scriptEditorStep)
  .then(audioGeneratorStep)
  .commit();
