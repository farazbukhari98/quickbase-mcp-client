import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

// Store for active MCP processes
const mcpProcesses = new Map();

function getMCPProcess(sessionId: string) {
  if (!mcpProcesses.has(sessionId)) {
    const mcp = spawn('npx', ['-y', 'mcp-quickbase'], {
      env: {
        ...process.env,
        QUICKBASE_REALM_HOST: 'cmscontrols.quickbase.com',
        QUICKBASE_USER_TOKEN: 'cay9u4_qkp6_0_cq3jiqi2mngcdc239fct7d9avy',
        QUICKBASE_APP_ID: 'btfi6y34y'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Initialize MCP
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'quickbase-mcp-client',
          version: '1.0.0'
        }
      }
    }) + '\n');

    mcpProcesses.set(sessionId, mcp);

    // Clean up after 5 minutes of inactivity
    setTimeout(() => {
      if (mcpProcesses.has(sessionId)) {
        mcp.kill();
        mcpProcesses.delete(sessionId);
      }
    }, 5 * 60 * 1000);
  }

  return mcpProcesses.get(sessionId);
}

export async function POST(request: NextRequest) {
  try {
    const { method, params, sessionId = 'default' } = await request.json();
    
    console.log(`Calling QuickBase tool: ${method}`, params);
    
    const mcp = getMCPProcess(sessionId);
    
    // Wait a bit for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return new Promise((resolve) => {
      let buffer = '';
      let responseHandled = false;
      let initReceived = false;
      
      const handleData = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() && !responseHandled) {
            try {
              const message = JSON.parse(line);
              console.log('MCP Response:', message);
              
              // Skip initialization messages
              if (message.result && message.result.protocolVersion) {
                initReceived = true;
                continue;
              }
              
              // Handle tool response
              if (message.id === 999) {
                responseHandled = true;
                mcp.stdout.removeListener('data', handleData);
                
                // Extract the actual result
                if (message.result && message.result.content) {
                  // Parse the content if it's a JSON string
                  try {
                    const content = message.result.content[0];
                    if (content && content.type === 'text') {
                      const parsed = JSON.parse(content.text);
                      resolve(NextResponse.json({ result: parsed }));
                    } else {
                      resolve(NextResponse.json({ result: message.result }));
                    }
                  } catch {
                    resolve(NextResponse.json({ result: message.result }));
                  }
                } else if (message.error) {
                  resolve(NextResponse.json({ error: message.error }, { status: 500 }));
                } else {
                  resolve(NextResponse.json({ result: message.result || message }));
                }
              }
            } catch (e) {
              console.error('Parse error:', e, 'Line:', line);
            }
          }
        }
      };
      
      mcp.stdout.on('data', handleData);
      mcp.stderr.on('data', (data) => {
        console.error('MCP stderr:', data.toString());
      });
      
      // Send the tool call request
      const toolRequest = {
        jsonrpc: '2.0',
        id: 999,
        method: 'tools/call',
        params: {
          name: method,
          arguments: params || {}
        }
      };
      
      console.log('Sending tool request:', toolRequest);
      mcp.stdin.write(JSON.stringify(toolRequest) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!responseHandled) {
          mcp.stdout.removeListener('data', handleData);
          resolve(NextResponse.json({ 
            error: 'Request timeout' 
          }, { status: 500 }));
        }
      }, 30000);
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}