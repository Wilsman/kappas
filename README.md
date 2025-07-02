# Task Tracker with Mind Map

An interactive task management application featuring a dynamic mind map visualization for better task organization and workflow management.

## Features

- Interactive mind map visualization of tasks and their relationships
- Pan and zoom functionality for navigating complex task hierarchies
- Intuitive task creation and management
- Clean, modern UI built with React and TypeScript
- Responsive design for various screen sizes

## Tarkov.dev query

```graphql
{
  tasks(lang: en) {
    id
    minPlayerLevel
    kappaRequired
    lightkeeperRequired
    map {
      name
    }
    taskRequirements {
      task {
        id
        name
      }
    }
    trader {
      name
    }
    wikiLink
    name
  }
}
```

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Vite

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Project Structure

- `/src` - Source code
  - `/components` - Reusable React components
  - `/data` - Sample data and types
  - `/lib` - Utility functions and helpers

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT
