import { z } from "zod";

import { Step, Workflow } from "@mastra/core/workflows";
import { scriptGenerator } from "./agents";
import { scriptEditor } from "./agents/script-editor";

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

const generateScriptStep = new Step({
  id: "generateScriptStep",
  outputSchema: z.object({
    script: z.string(),
  }),
  inputSchema: z.object({
    userInput: z.string(),
  }),
  execute: async ({ context }) => {
    const input = context?.getStepPayload<{
      userInput: string;
      length: number;
      style: string;
    }>("trigger");

    if (!input) throw new Error("Input is required");

    const prompt = `Generate a script for a deep dive based on what the user wants to listen to.
    
    User input: ${input.userInput}
    Length: ${input.length}
    Style: ${input.style}
    
    - The script should be ${input.length} words long.
    - The script should be written in ${input.style} style.
    - The script should not contain timestamps or timecodes for when things should be said.
    - The script should not contain any other text than the script.
    - Use markdown formatting for the script and the chapters.
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
    const script = context?.getStepPayload<{
      script: string;
    }>("generateScriptStep")?.script;
    const userInput = context?.triggerData;

    if (!script) throw new Error("Script is required");

    const prompt = `Edit the script to make it more engaging and interesting for the user and their needs.
    
    Script: ${script}
    Style: ${userInput?.style}
    Length: ${userInput?.length}

    - The script is targeted to a single person to listen to.
    - The script should be written in ${userInput?.style} style.
    - The script should be ${userInput?.length} words long.
    - The script should not contain timestamps or timecodes for when things should be said.
    - The script should not contain any other text than the script.
    - Use markdown formatting for the script and the chapters.
    `;

    const res = await scriptEditor.generate(prompt, {
      output: z.object({
        script: z.string(),
      }),
    });
    return { script: res.object.script };
  },
});

myWorkflow.step(generateScriptStep).then(scriptEditorStep).commit();
