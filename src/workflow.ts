import { z } from "zod";

import { Step, Workflow } from "@mastra/core/workflows";

export const myWorkflow = new Workflow({
  name: "my-workflow",
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

const stepOne = new Step({
  id: "stepOne",
  outputSchema: z.object({
    doubledValue: z.number(),
  }),
  execute: async ({ context }) => {
    const doubledValue = context.triggerData.inputValue * 2;
    return { doubledValue };
  },
});

const stepTwo = new Step({
  id: "stepTwo",
  execute: async ({ context }) => {
    if (context.steps.stepOne.status !== "success") {
      return { incrementedValue: 0 };
    }
    return {
      incrementedValue: context.steps.stepOne.output.doubledValue + 1,
    };
  },
});

myWorkflow.step(stepOne).then(stepTwo).commit();
