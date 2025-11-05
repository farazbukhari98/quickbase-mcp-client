#!/usr/bin/env node

/**
 * Unified server entry point for Render deployment
 * Runs both Next.js production server and MCP WebSocket bridge
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MCP_PORT = process.env.MCP_PORT || 3003;

console.log('Starting QuickBase MCP Client...');
console.log(`Next.js will run on port ${PORT}`);
console.log(`MCP Bridge will run on port ${MCP_PORT}`);

// Start MCP Bridge
const mcpBridge = spawn('node', [path.join(__dirname, 'mcp-bridge.js')], {
  env: {
    ...process.env,
    PORT: MCP_PORT
  },
  stdio: 'inherit'
});

mcpBridge.on('error', (err) => {
  console.error('Failed to start MCP Bridge:', err);
  process.exit(1);
});

mcpBridge.on('exit', (code) => {
  console.log(`MCP Bridge exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Start Next.js
const nextServer = spawn('npx', ['next', 'start', '-p', PORT], {
  env: process.env,
  stdio: 'inherit'
});

nextServer.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
  mcpBridge.kill();
  process.exit(1);
});

nextServer.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  mcpBridge.kill();
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  mcpBridge.kill('SIGINT');
  nextServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  mcpBridge.kill('SIGTERM');
  nextServer.kill('SIGTERM');
});

console.log('Both servers started successfully!');
