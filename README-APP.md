# QuickBase MCP Client

A chat-based web interface for managing QuickBase data through an MCP (Model Context Protocol) server.

## Features

- 🎯 **Chat-Based Interface**: Natural language interactions with your QuickBase data
- 📊 **Data Explorer**: Visual sidebar for browsing apps, tables, and records
- 🔄 **Real-time Connection Status**: Visual indicators for connection states
- 🔐 **Secure Authentication**: Token-based authentication with QuickBase
- 💬 **Smart Suggestions**: Context-aware command suggestions
- 📱 **Responsive Design**: Works on desktop and tablet devices

## Prerequisites

- Node.js 18+ 
- QuickBase account with API access
- MCP server running (e.g., danielbushman/MCP-Quickbase)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd quickbase-mcp-client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
NEXT_PUBLIC_MCP_SERVER_URL=ws://localhost:3001
NEXT_PUBLIC_QUICKBASE_REALM=your-realm.quickbase.com
NEXT_PUBLIC_QUICKBASE_USER_TOKEN=your-token-here
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Usage

### Getting Started

1. **Connect to MCP Server**: Enter your QuickBase credentials and MCP server URL
2. **Explore Data**: Use the sidebar to browse your QuickBase applications and tables
3. **Chat Commands**: Interact with your data using natural language or commands

### Available Commands

- `show apps` - List all QuickBase applications
- `select app [name]` - Select an application to work with
- `show tables` - List tables in the selected app
- `select table [name]` - Select a table to work with
- `show records` - Query records from the selected table
- `help` - Show available commands

### Chat Interface

The chat interface supports:
- Natural language queries about your data
- Quick action buttons for common operations
- Visual data display with interactive elements
- Error handling with helpful messages

## Architecture

```
├── app/                    # Next.js app directory
├── components/
│   ├── chat/              # Chat interface components
│   ├── sidebar/           # Data explorer sidebar
│   └── ui/                # Shadcn UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   └── mcp/              # MCP connection management
├── store/                 # Zustand state management
└── types/                 # TypeScript definitions
```

## MCP Server Setup

This client is designed to work with QuickBase MCP servers. Ensure your MCP server:

1. Supports WebSocket connections
2. Implements QuickBase API tools
3. Handles authentication properly
4. Is accessible from your client URL

## Development

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **WebSocket**: Native WebSocket API

### Key Components

- `MCPConnection`: Manages WebSocket connection to MCP server
- `ChatInterface`: Main chat UI component
- `DataExplorer`: Sidebar for browsing QuickBase structure
- `useQuickBase`: Hook for QuickBase operations

## Troubleshooting

### Connection Issues

- Verify MCP server is running and accessible
- Check WebSocket URL format (ws:// or wss://)
- Ensure QuickBase token has necessary permissions
- Check browser console for detailed error messages

### Data Not Loading

- Confirm you've selected an app and table
- Check network tab for API responses
- Verify QuickBase realm is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review MCP server documentation