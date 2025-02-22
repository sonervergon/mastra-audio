import { mastra } from "./mastra";

// Get the workflow
const myWorkflow = mastra.getWorkflow("myWorkflow");
const { start } = myWorkflow.createRun();

// Start the workflow execution
const run = await start({ triggerData: { inputValue: 45 } });

console.log(run.results);
