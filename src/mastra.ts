import { Mastra } from "@mastra/core";
import { myWorkflow } from "./workflow";

export const mastra = new Mastra({
  workflows: { myWorkflow },
});
