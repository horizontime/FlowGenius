import { INote, INoteEntry } from '@/shared/types';

// Function to get OpenAI API key from localStorage
function getOpenAIApiKey(): string {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('openai_api_key');
    return storedKey?.trim() || '';
  }
  return '';
}

// Function to create content text from note entries
function createContentFromEntries(entries: INoteEntry[]): string {
  if (!entries || entries.length === 0) {
    return '';
  }

  return entries.map(entry => {
    let content = `**${entry.heading}**\n`;
    if (entry.body && entry.body.trim()) {
      content += `${entry.body}\n`;
    }
    return content;
  }).join('\n');
}

// Main summarization function
export async function summarizeNote(note: INote): Promise<string> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
  }

  if (!note.entries || note.entries.length === 0) {
    throw new Error('No content found in the note to summarize.');
  }

  const content = createContentFromEntries(note.entries);
  if (!content.trim()) {
    throw new Error('No content found in the note entries to summarize.');
  }

  const prompt = `Please provide a structured summary of the following note content. For each note entry, create a bullet point with the entry title, followed by sub-bullets summarizing the key points from that entry's content.

Use this exact format:
• Entry Title 1
  - Key point or summary about this entry
  - Another important point about this entry
  - Additional relevant details

• Entry Title 2
  - Key point or summary about this entry
  - Another important point about this entry

Note Title: "${note.title}"

Content:
${content}

Summary:`;

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
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error('No summary generated from OpenAI API.');
    }

    return summary;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate summary. Please check your API key and internet connection.');
  }
} 