/**
 * Simple test to verify MCP tools are accessible
 */

async function testToolAvailability() {
  console.log('Testing MCP Tool Availability\n');
  
  const baseUrl = 'http://localhost:3000/api/quickbase';
  
  // Test just a few critical tools with timeout
  const tools = [
    { name: 'test_connection', params: {} },
    { name: 'list_tables', params: { app_id: 'btfi6y34y' } },
    { name: 'get_table_fields', params: { table_id: 'bthajfmdr' } }
  ];
  
  for (const tool of tools) {
    console.log(`Testing ${tool.name}...`);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: tool.name,
          params: tool.params
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      const result = await response.json();
      
      if (result.error) {
        console.log(`❌ ${tool.name}: ${result.error}`);
      } else {
        console.log(`✅ ${tool.name}: Success`);
        // Show a sample of the result
        const preview = JSON.stringify(result).substring(0, 100);
        console.log(`   Preview: ${preview}...`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏱️ ${tool.name}: Timed out after 5 seconds`);
      } else {
        console.log(`❌ ${tool.name}: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  // Now test if the AI endpoint recognizes all tools
  console.log('Testing AI endpoint tool recognition...\n');
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const aiResponse = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Can you check my QuickBase configuration?',
        context: []
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const aiResult = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏱️ AI endpoint: Timed out after 10 seconds');
    } else {
      console.log(`❌ AI endpoint: ${error.message}`);
    }
  }
  
  console.log('\nTest complete!');
}

// Run the test
testToolAvailability().catch(console.error);