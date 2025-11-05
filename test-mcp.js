const WebSocket = require('ws');

console.log('Testing MCP WebSocket connection...');

const ws = new WebSocket('ws://localhost:3003');

ws.on('open', () => {
  console.log('✓ Connected to MCP bridge');
  
  // Send test message
  const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('Sending test message...');
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('✗ Connection error:', error.message);
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('Test complete, closing connection...');
  ws.close();
}, 5000);