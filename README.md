# FlowGenius

An AI-native note-taking app that leverages LangGraph to automatically research topics, populate note entries, and intelligently organize your ideas.

## Overview

FlowGenius is a modern, Electron-based note-taking application designed from the ground up with AI at its core. Unlike traditional note apps with AI features bolted on, FlowGenius uses artificial intelligence as the primary mechanism for content creation and organization, making knowledge capture and synthesis effortless.

## Features

### Core Features
- **Three-Panel Interface**: Intuitive layout with notes list, entries list, and rich text editor
- **Real-time Search**: Instantly search across all notes and entries
- **Note Organization**: Create multiple entries within each note for better structure
- **Rich Text Editing**: Full-featured EditorJS-based editor with headers, lists, quotes, and more
- **Drag & Drop**: Reorder note entries with intuitive drag-and-drop interface
- **Tag System**: Organize notes with AI-generated tags and filter by tags
- **Dark Mode**: Built-in dark theme for comfortable viewing
- **Local Storage**: All data stored locally in SQLite database

### AI Features
- **✨ AI Enhancement**: Click the sparkle button on any note entry to automatically generate:
  - Brief description of the entry topic in context of the note title
  - Three interesting facts about the topic
  - Practical learning guide with actionable next steps
- **📝 AI Summarization**: Generate structured summaries of entire notes with bullet points for each entry
- **📚 AI Study Plans**: Create 3-day learning syllabi with daily activities and resources
- **🏷️ Auto-tagging**: Intelligent tag generation from predefined categories based on note content
- **LangGraph Integration**: Powered by LangGraph workflow with conditional logic and validation
- **Smart Content Generation**: Context-aware AI that considers both note titles and entry headings

### Technical Features
- **API Key Management**: Secure local storage of OpenAI API keys with configuration modal
- **Data Persistence**: SQLite database with proper foreign key relationships
- **Real-time Updates**: Instant UI updates with optimistic rendering
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Migration Support**: Automatic database schema migrations

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Framework**: Electron 35.2.1
- **Styling**: Tailwind CSS 4.1.4 + shadcn/ui components
- **Database**: SQLite 3 (local storage)
- **State Management**: Zustand 5.0.3
- **Rich Text Editor**: EditorJS 2.30.8
- **Build Tools**: Webpack + Electron Forge 6.4.2
- **AI Integration**: 
  - LangGraph 0.3.6 (workflow orchestration)
  - OpenAI GPT-4o-mini (language model)
  - LangChain 0.3.61 (AI framework)
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React 0.503.0
- **Drag & Drop**: DND Kit 6.3.1

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm 

### Setup

1. Clone the repository:
```bash
git clone https://github.com/horizontime/FlowGenius.git
cd FlowGenius
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables for AI features:
```bash
# Create a .env file in the root directory
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

4. Start the development server:
```bash
npm start
```

### Building

To create a production build:

```bash
npm run make
```

This will create platform-specific installers in the `out` directory.

## Usage

### Basic Features
1. **Create a Note**: Click the + button in the left panel to create a new note
2. **Add Entries**: Select a note and click the + button in the middle panel to add entries
3. **Edit Content**: Click on any entry to start editing in the rich text editor
4. **Search**: Use the search bar to find notes and entries instantly
5. **Rename**: Double-click note titles or entry headings to rename them
6. **Reorder**: Drag and drop entries to reorder them within a note
7. **Delete**: Use the trash icon to delete notes or entries
8. **Filter by Tags**: Click on tags to filter notes by category

### AI Features

#### Configure API Key
- Click the key icon (🔑) in the top-right corner to configure your OpenAI API key
- The key is stored securely in your browser's local storage

#### AI Enhancement (✨)
- Hover over any note entry in the middle panel
- Click the sparkle (✨) button that appears
- The AI will generate relevant content based on your note title and entry heading
- Content includes description, facts, and learning guide
- Example: Note "Python Programming" + Entry "Variables" → generates Python variable explanations

#### AI Summarization (📝)
- Click the document icon in the top bar when viewing a note
- Generates a structured summary with bullet points for each entry
- Perfect for reviewing key points from lengthy notes

#### AI Study Plans (📚)
- Click the calendar icon in the top bar when viewing a note
- Creates a 3-day learning syllabus with daily activities
- Includes practical resources and hands-on tasks
- Motivational tips included

#### Auto-tagging (🏷️)
- Tags are automatically generated when notes have substantial content (>50 characters)
- Generated after AI enhancement or manual content addition
- Uses predefined categories like 'learning', 'work', 'technology', etc.

## Project Structure

```
FlowGenius/
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── forge.config.ts             # Electron Forge configuration
├── webpack.*.config.ts         # Webpack build configuration
├── postcss.config.mjs          # PostCSS configuration
├── components.json             # shadcn/ui configuration
├── notes.sql                   # SQLite database file
├── src/
│   ├── index.ts                # Electron main process
│   ├── preload.ts              # Preload script for security
│   ├── renderer.ts             # Electron renderer entry
│   ├── index.html              # Main HTML template
│   ├── App.tsx                 # React root component
│   ├── app-components/         # Main UI components
│   │   ├── Wrapper.tsx         # Main app layout
│   │   ├── Editor.tsx          # Rich text editor
│   │   ├── EmptyNoteUI.tsx     # Empty state UI
│   │   └── EditorJSTemplate.tsx # EditorJS integration
│   ├── components/             # Reusable UI components
│   │   ├── ApiKeyModal.tsx     # API key configuration
│   │   ├── SummaryModal.tsx    # AI summary display
│   │   ├── StudyPlanModal.tsx  # AI study plan display
│   │   ├── TagsDisplay.tsx     # Tag rendering
│   │   ├── TagFilter.tsx       # Tag filtering
│   │   └── ui/                 # shadcn/ui primitives
│   ├── services/               # AI services
│   │   ├── ai-workflow.ts      # LangGraph workflow
│   │   ├── ai-summarize.ts     # Note summarization
│   │   ├── ai-study-plan.ts    # Study plan generation
│   │   └── ai-tag-generator.ts # Tag generation
│   ├── database/
│   │   └── db.ts               # SQLite operations
│   ├── shared/                 # Shared utilities
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── functions.ts        # Utility functions
│   │   ├── events.ts           # Event definitions
│   │   └── zust-store.ts       # Zustand state management
│   └── lib/
│       └── utils.ts            # General utilities
└── README.md
```

## Database Schema

### Notes Table
- `id`: Primary key
- `title`: Note title
- `summary`: AI-generated summary (optional)
- `study_plan`: AI-generated study plan (optional)
- `tags`: JSON array of tags (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Note Entries Table
- `id`: Primary key
- `note_id`: Foreign key to notes table
- `heading`: Entry title
- `body`: Entry content (rich text)
- `order_index`: Display order
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
