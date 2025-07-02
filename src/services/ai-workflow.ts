// @ts-nocheck
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Function to get API key from parameter or environment
function getOpenAIApiKey(providedApiKey?: string): string {
  // First try the provided API key
  if (providedApiKey && providedApiKey.trim()) {
    return providedApiKey.trim();
  }
  
  // Fallback to environment variable
  return process.env.OPENAI_API_KEY || '';
}

// Initialize OpenAI LLM
function createLLM(apiKey?: string) {
  const finalApiKey = getOpenAIApiKey(apiKey);
  if (!finalApiKey) {
    throw new Error('No OpenAI API key found. Please set up your API key in the settings.');
  }
  
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    openAIApiKey: finalApiKey,
  });
}

// Graph state
const StateAnnotation = Annotation.Root({
  noteTitle: Annotation,
  entryHeading: Annotation,
  apiKey: Annotation,
  initialResponse: Annotation,
  facts: Annotation,
  learningGuide: Annotation,
  finalResult: Annotation,
});

// First LLM call to analyze the subheading in context of note title
async function analyzeSubheading(state: typeof StateAnnotation.State) {
  const prompt = `Given the note title "${state.noteTitle}" and the entry subheading "${state.entryHeading}", provide a brief description of what "${state.entryHeading}" means in the context of "${state.noteTitle}". Keep the response to a maximum of 300 characters.`;
  
  const llm = createLLM(state.apiKey);
  const msg = await llm.invoke(prompt);
  return { initialResponse: msg.content as string };
}

// Gate function to check if response is valid
function validateResponse(state: typeof StateAnnotation.State) {
  const response = (state.initialResponse as string) || "";
  const noteTitle = (state.noteTitle as string) || "";
  const entryHeading = (state.entryHeading as string) || "";
  
  console.log("=== GATE FUNCTION DEBUG ===");
  console.log("Response length:", response.length);
  console.log("Response:", response);
  console.log("Note title:", noteTitle);
  console.log("Entry heading:", entryHeading);
  
  // Check if response is at most 350 characters
  if (response.length > 350) {
    console.log("❌ Failed: Response too long");
    return "Fail";
  }
  
  // More flexible word matching - check if any meaningful word appears
  const titleWords = noteTitle.toLowerCase().split(/\s+/).filter(word => word.length > 1);
  const headingWords = entryHeading.toLowerCase().split(/\s+/).filter(word => word.length > 1);
  const responseLower = response.toLowerCase();
  
  console.log("Title words:", titleWords);
  console.log("Heading words:", headingWords);
  
  // Check for word matches (allow shorter words and partial matches)
  const matchingTitleWords = titleWords.filter(word => responseLower.includes(word));
  const matchingHeadingWords = headingWords.filter(word => responseLower.includes(word));
  
  console.log("Matching title words:", matchingTitleWords);
  console.log("Matching heading words:", matchingHeadingWords);
  
  // More lenient validation - just need ANY word match OR reasonable length response
  const hasAnyMatch = matchingTitleWords.length > 0 || matchingHeadingWords.length > 0;
  const hasReasonableLength = response.length > 50; // At least 50 characters
  
  if (hasAnyMatch && hasReasonableLength) {
    console.log("✅ Passed validation");
    return "Pass";
  }
  
  console.log("❌ Failed validation - hasAnyMatch:", hasAnyMatch, "hasReasonableLength:", hasReasonableLength);
  return "Fail";
}

// Second LLM call to generate three facts
async function generateFacts(state: typeof StateAnnotation.State) {
  const prompt = `Based on the note title "${state.noteTitle}" and the subheading "${state.entryHeading}", provide exactly three interesting facts about "${state.entryHeading}" in relation to "${state.noteTitle}". Format each fact as a bullet point starting with "•".`;
  
  const llm = createLLM(state.apiKey);
  const msg = await llm.invoke(prompt);
  return { facts: msg.content as string };
}

// Third LLM call to generate learning guide
async function generateLearningGuide(state: typeof StateAnnotation.State) {
  const prompt = `Write a concise paragraph (400 characters or less) about how to get started learning about "${state.entryHeading}" in the context of "${state.noteTitle}". Make it practical and actionable.`;
  
  const llm = createLLM(state.apiKey);
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
export async function processNoteEntryWithAI(noteTitle: string, entryHeading: string, apiKey?: string): Promise<string | null> {
  try {
    const result = await aiWorkflow.invoke({ 
      noteTitle, 
      entryHeading,
      apiKey
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