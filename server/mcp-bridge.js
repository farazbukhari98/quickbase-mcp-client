#!/usr/bin/env node

const WebSocket = require('ws');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3003;

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`MCP WebSocket Bridge running on ws://localhost:${PORT}`);

wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.headers.origin || 'unknown');

  // Keep WebSocket alive
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Spawn MCP QuickBase server
  const mcp = spawn('npx', ['-y', 'mcp-quickbase'], {
    env: {
      ...process.env,
      QUICKBASE_REALM_HOST: process.env.QUICKBASE_REALM_HOST || 'cmscontrols.quickbase.com',
      QUICKBASE_USER_TOKEN: process.env.QUICKBASE_USER_TOKEN,
      QUICKBASE_APP_ID: process.env.QUICKBASE_APP_ID || 'btfi6y34y'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  // Handle MCP stdout
  mcp.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // Try to parse complete JSON messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          ws.send(JSON.stringify(message));
        } catch (e) {
          // Not JSON, might be initialization output
          console.log('MCP output:', line);
        }
      }
    }
  });

  // Handle MCP stderr
  mcp.stderr.on('data', (data) => {
    console.error('MCP error:', data.toString());
  });

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      // Write to MCP stdin
      mcp.stdin.write(JSON.stringify(data) + '\n');
    } catch (error) {
      console.error('Failed to process client message:', error);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('Client disconnected');
    mcp.kill();
  });

  // Handle MCP process exit
  mcp.on('exit', (code) => {
    console.log(`MCP process exited with code ${code}`);
    ws.close();
  });

  // Send initialization message
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'quickbase-mcp-client',
        version: '1.0.0'
      }
    }
  }) + '\n');
});

// Ping clients every 30 seconds to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

process.on('SIGINT', () => {
  console.log('\nShutting down MCP bridge...');
  clearInterval(interval);
  wss.close();
  process.exit(0);
});