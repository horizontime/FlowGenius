# FlowGenius

An AI-native note-taking app that leverages LangGraph to automatically research topics, populate note entries, and intelligently organize your ideas.

## Overview

FlowGenius is a modern, Electron-based note-taking application designed from the ground up with AI at its core. Unlike traditional note apps with AI features bolted on, FlowGenius uses artificial intelligence as the primary mechanism for content creation and organization, making knowledge capture and synthesis effortless.

## Features

### Current Features
- **Three-Panel Interface**: Intuitive layout with notes list, entries list, and content editor
- **Real-time Search**: Instantly search across all notes and entries
- **Note Organization**: Create multiple entries within each note for better structure
- **Content Preview**: See text previews in the entries panel for quick scanning
- **Dark Mode**: Built-in dark theme for comfortable viewing

### AI Features
- **✨ AI Enhancement (Available)**: Click the sparkle button on any note entry to automatically generate:
  - Brief description of the entry topic in context of the note title
  - Three facts about the topic
  - Learning guide with actionable next steps
- **LangGraph Integration**: Powered by LangGraph prompt chaining workflow
- **Smart Organization**: AI-powered note sorting and categorization (planned)
- **Content Suggestions**: Intelligent recommendations for related topics and connections (planned)
- **Auto-summarization**: Generate concise summaries of extended note entries (planned)

## Tech Stack

- **Frontend**: React + TypeScript
- **Framework**: Electron
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite (local storage)
- **Build Tools**: Webpack + Electron Forge
- **AI Integration**: LangGraph Workflow Builder + OpenAI GPT-4o-mini
- **Environment**: dotenv for configuration

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
3. **Edit Content**: Click on any entry to start editing in the right panel
4. **Search**: Use the search bar to find notes and entries quickly
5. **Double-click to Edit**: Double-click note titles or entry headings to rename them

### AI Features
6. **✨ AI Enhancement**: 
   - Hover over any note entry in the middle panel
   - Click the sparkle (✨) button that appears
   - The AI will automatically generate relevant content and append it to your entry
   - The workflow creates: description, facts, and learning guide based on your note title and entry heading
   - Example: For a note titled "Madagascar" with entry "Penguins", it generates info about The Penguins of Madagascar movie

## Project Structure

```
FlowGenius/
├── package.json
├── package-lock.json
├── tsconfig.json
├── components.json
├── forge.config.ts              # Electron Forge configuration
├── webpack.main.config.ts
├── webpack.renderer.config.ts
├── webpack.rules.ts
├── webpack.plugins.ts
├── postcss.config.mjs
├── notes.sql                    # Sample SQLite data
├── src/
│   ├── index.ts                 # Electron main process
│   ├── preload.ts               # Preload script for renderer
│   ├── renderer.ts              # Electron renderer entry
│   ├── index.html               # Renderer HTML template
│   ├── index.css                # Global styles
│   ├── App.tsx                  # React root component
│   ├── app-components/          # High-level UI panels & editor
│   │   ├── Wrapper.tsx
│   │   ├── Editor.tsx
│   │   └── ...
│   ├── assets/
│   │   └── SharedComponents.tsx
│   ├── child-process/           # Secondary Electron windows (optional)
│   │   └── ...
│   ├── components/              # Reusable UI primitives (shadcn/ui)
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── ...
│   ├── database/
│   │   └── db.ts
│   ├── services/                # AI workflow services
│   │   └── ai-workflow.ts       # LangGraph prompt chaining implementation
│   ├── shared/                  # Shared types, events, stores
│   │   ├── types.ts
│   │   └── zust-store.ts
│   └── lib/
│       └── utils.ts
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

