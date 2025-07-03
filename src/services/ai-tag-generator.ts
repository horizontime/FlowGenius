import { INote, INoteEntry } from '@/shared/types';

// Predefined tags that OpenAI can choose from
const PREDEFINED_TAGS = [
  'productivity', 'learning', 'work', 'recreation', 'personal', 'business',
  'education', 'health', 'fitness', 'technology', 'programming', 'research',
  'creative', 'writing', 'planning', 'goals', 'ideas', 'meeting', 'project',
  'finance', 'travel', 'cooking', 'hobbies', 'family', 'friends', 'movies',
  'books', 'music', 'sports', 'gaming', 'shopping', 'home', 'garden',
  'science', 'art', 'design', 'marketing', 'sales', 'strategy', 'analysis',
  'documentation', 'tutorial', 'reference', 'inspiration', 'motivation',
  'thoughts', 'reflection', 'journal', 'diary', 'reminders'
];

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

// Main tag generation function
export async function generateTagsForNote(note: INote): Promise<string[]> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
  }

  if (!note.entries || note.entries.length === 0) {
    return [];
  }

  const content = createContentFromEntries(note.entries);
  if (!content.trim()) {
    return [];
  }

  const prompt = `Analyze the following note content and suggest 1-3 most relevant tags from the provided list. Return only the tag names, separated by commas, with no additional text or explanation.

Available tags to choose from:
${PREDEFINED_TAGS.join(', ')}

Note Title: "${note.title}"

Content:
${content}

Select 1-3 most relevant tags from the list above:`;

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
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const tagsText = data.choices?.[0]?.message?.content?.trim();

    if (!tagsText) {
      return [];
    }

    // Parse the response and validate tags
    const suggestedTags = tagsText
      .split(',')
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag && PREDEFINED_TAGS.includes(tag))
      .slice(0, 3); // Ensure max 3 tags

    return suggestedTags;
  } catch (error) {
    console.error('Error calling OpenAI API for tag generation:', error);
    return [];
  }
}

// Export predefined tags for use in UI
export { PREDEFINED_TAGS }; 