import { mastra } from "./mastra";

// Get the workflow
const myWorkflow = mastra.getWorkflow("myWorkflow");
const { start } = myWorkflow.createRun();

// Start the workflow execution
const run = await start({
  triggerData: {
    userInput:
      "I want to learn more about starting a startup and the best practices for it",
    length: 1000,
    style: "casual",
  },
});

console.log(JSON.stringify(run.results, null, 2));
