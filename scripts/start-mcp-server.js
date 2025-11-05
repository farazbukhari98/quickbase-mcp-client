#!/usr/bin/env node

const { spawn } = require('child_process');

// Start the MCP QuickBase server with the environment variables
const mcpServer = spawn('npx', ['-y', 'mcp-quickbase'], {
  env: {
    ...process.env,
    QUICKBASE_REALM_HOST: 'cmscontrols.quickbase.com',
    QUICKBASE_USER_TOKEN: 'cay9u4_qkp6_0_cq3jiqi2mngcdc239fct7d9avy',
    QUICKBASE_APP_ID: 'btfi6y34y',
    PORT: '3001'
  },
  stdio: 'inherit'
});

mcpServer.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});

mcpServer.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  mcpServer.kill('SIGINT');
  process.exit(0);
});

console.log('Starting QuickBase MCP server on port 3001...');