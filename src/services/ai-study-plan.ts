import { INote, INoteEntry } from '@/shared/types';

// Function to get OpenAI API key from localStorage
function getOpenAIApiKey(): string {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('openai_api_key');
    return storedKey?.trim() || '';
  }
  return '';
}

// Function to format entries for the study plan prompt
function formatEntriesForPrompt(entries: INoteEntry[]): string {
  if (!entries || entries.length === 0) {
    return '';
  }

  return entries.map(entry => {
    const heading = entry.heading || 'Untitled';
    const body = entry.body?.trim() || '';
    return `${heading} – ${body}`;
  }).join('\n');
}

// Main study plan generation function
export async function generateStudyPlan(note: INote): Promise<string> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
  }

  if (!note.entries || note.entries.length === 0) {
    throw new Error('No content found in the note to create a study plan.');
  }

  const formattedEntries = formatEntriesForPrompt(note.entries);
  if (!formattedEntries.trim()) {
    throw new Error('No content found in the note entries to create a study plan.');
  }

  const systemPrompt = `You are an experienced course designer who creates concise, actionable learning plans.`;

  const userPrompt = `I have a note in my knowledge base that represents a learning goal.

Note title: **${note.title}**

Each entry in that note is a sub-topic I want to learn.  
Here are the entries (heading, followed by any existing notes I've written in parentheses):

${formattedEntries}

Please design a **3-day syllabus** that will teach me these topics in a logical order.
Guidelines:
1. Use exactly three top-level sections: "Day 1", "Day 2", "Day 3".
2. Under each day, list 3–5 learning activities, each on its own line starting with "•".
3. Prefer free or easily-accessible resources (articles, docs, YouTube, etc.).
4. Balance theory and practice; at least one hands-on task per day.
5. Keep each bullet to ≤ 120 characters so it fits nicely in my notes.
6. Finish with a short motivational tip (≤ 40 words).`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const studyPlan = data.choices?.[0]?.message?.content?.trim();

    if (!studyPlan) {
      throw new Error('No study plan generated from OpenAI API.');
    }

    return studyPlan;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate study plan. Please check your API key and internet connection.');
  }
} 