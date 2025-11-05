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

### Development Mode
```bash
# Run Next.js only
npm run dev

# Run Next.js + MCP Bridge together
npm run dev:all
```

### Production Build
```bash
npm run build
npm start
```

## Deploying to Render

### Step 1: Prerequisites
1. A [Render account](https://render.com)
2. Your code pushed to a GitHub repository
3. QuickBase user token with appropriate permissions
4. Anthropic API key

### Step 2: Create Web Service on Render
1. Go to your Render Dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: quickbase-mcp-client (or your preferred name)
   - **Region**: Choose nearest to your users
   - **Branch**: main
   - **Root Directory**: Leave blank (or specify if needed)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables
In the Render dashboard, add these environment variables:

**Required:**
- `QUICKBASE_USER_TOKEN`: Your QuickBase user token
- `ANTHROPIC_API_KEY`: Your Anthropic API key

**Optional (with defaults):**
- `QUICKBASE_REALM_HOST`: Your QuickBase realm (default: `cmscontrols.quickbase.com`)
- `QUICKBASE_APP_ID`: Your QuickBase app ID (default: `btfi6y34y`)
- `NEXT_PUBLIC_APP_NAME`: App display name (default: `QuickBase MCP Client`)
- `NEXT_PUBLIC_AUTO_CONNECT`: Auto-connect on load (default: `true`)
- `MCP_PORT`: MCP Bridge port (default: `3003`)

**Automatically Provided by Render:**
- `PORT`: The port Next.js will run on (Render sets this automatically)

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Once deployed, you'll receive a public URL (e.g., `https://your-app.onrender.com`)

### Step 5: Configure Frontend to Use Deployed WebSocket
The MCP Bridge runs on the same server, so update your environment to use the deployed domain:
- `NEXT_PUBLIC_MCP_SERVER_URL`: Set to `wss://your-app.onrender.com:3003` (use `wss://` for secure WebSocket)

### Notes
- Render's free tier puts services to sleep after inactivity
- First request after sleep may take 30-60 seconds
- For production, consider upgrading to a paid tier for always-on service
- The unified server (`server/render-server.js`) runs both Next.js and the MCP Bridge

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