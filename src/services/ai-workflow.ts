import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Initialize OpenAI LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Graph state
const StateAnnotation = Annotation.Root({
  noteTitle: Annotation,
  entryHeading: Annotation,
  initialResponse: Annotation,
  facts: Annotation,
  learningGuide: Annotation,
  finalResult: Annotation,
});

// First LLM call to analyze the subheading in context of note title
async function analyzeSubheading(state: typeof StateAnnotation.State) {
  const prompt = `Given the note title "${state.noteTitle}" and the entry subheading "${state.entryHeading}", provide a brief description of what "${state.entryHeading}" means in the context of "${state.noteTitle}". Keep the response to a maximum of 300 characters.`;
  
  const msg = await llm.invoke(prompt);
  return { initialResponse: msg.content as string };
}

// Gate function to check if response is valid
function validateResponse(state: typeof StateAnnotation.State) {
  const response = (state.initialResponse as string) || "";
  console.log("response", response);

  // Check if response is at most 300 characters
  if (response.length > 350) {
    return "Fail";
  }


  
  // Check if one word from title and one word from heading are in the response
  const titleWords = (state.noteTitle as string).toLowerCase().split(/\s+/);
  const headingWords = (state.entryHeading as string).toLowerCase().split(/\s+/);
  const responseLower = response.toLowerCase();
  
  const hasTitleWord = titleWords.some((word: string) => word.length > 2 && responseLower.includes(word));
  const hasHeadingWord = headingWords.some((word: string) => word.length > 2 && responseLower.includes(word));
  
  if (hasTitleWord && hasHeadingWord) {
    return "Pass";
  }
  
  return "Fail";
}

// Second LLM call to generate three facts
async function generateFacts(state: typeof StateAnnotation.State) {
  const prompt = `Based on the note title "${state.noteTitle}" and the subheading "${state.entryHeading}", provide exactly three interesting facts about "${state.entryHeading}" in relation to "${state.noteTitle}". Format each fact as a bullet point starting with "•".`;
  
  const msg = await llm.invoke(prompt);
  return { facts: msg.content as string };
}

// Third LLM call to generate learning guide
async function generateLearningGuide(state: typeof StateAnnotation.State) {
  const prompt = `Write a concise paragraph (400 characters or less) about how to get started learning about "${state.entryHeading}" in the context of "${state.noteTitle}". Make it practical and actionable.`;
  
  const msg = await llm.invoke(prompt);
  return { learningGuide: msg.content as string };
}

// Combine all results
async function combineResults(state: typeof StateAnnotation.State) {
  const finalResult = `${state.initialResponse as string}\n\n${state.facts as string}\n\n${state.learningGuide as string}`;
  return { finalResult };
}

// Build the workflow
const aiWorkflow = new StateGraph(StateAnnotation)
  .addNode("analyzeSubheading", analyzeSubheading)
  .addNode("generateFacts", generateFacts)
  .addNode("generateLearningGuide", generateLearningGuide)
  .addNode("combineResults", combineResults)
  .addEdge("__start__", "analyzeSubheading")
  .addConditionalEdges("analyzeSubheading", validateResponse, {
    Pass: "generateFacts",
    Fail: "__end__"
  })
  .addEdge("generateFacts", "generateLearningGuide")
  .addEdge("generateLearningGuide", "combineResults")
  .addEdge("combineResults", "__end__")
  .compile();

// Export the main function to process note entry
export async function processNoteEntryWithAI(noteTitle: string, entryHeading: string): Promise<string | null> {
  try {
    const result = await aiWorkflow.invoke({ 
      noteTitle, 
      entryHeading 
    });
    
    const finalResult = result.finalResult as string;
    if (finalResult) {
      return finalResult;
    } else {
      // If validation failed, return a simple message
      return "The AI analysis didn't meet quality criteria. Please try with a different note title or entry heading.";
    }
  } catch (error) {
    console.error("Error in AI workflow:", error);
    return "An error occurred while processing your request. Please check your OpenAI API key and try again.";
  }
} 