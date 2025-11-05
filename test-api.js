async function testAPIs() {
  console.log('Testing QuickBase MCP API with Claude AI...\n');
  
  // Test get_table_fields directly
  console.log('0. Testing get_table_fields directly:');
  try {
    const response = await fetch('http://localhost:3000/api/quickbase', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'get_table_fields',
        params: { table_id: 'bthajfmdr' } // Projects table - note: underscore not camelCase
      })
    });
    const result = await response.json();
    console.log('✅ Get table fields result:', JSON.stringify(result, null, 2).substring(0, 500));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 1: Direct QuickBase API - Test Connection
  console.log('1. Testing direct QuickBase API - test_connection:');
  try {
    const response1 = await fetch('http://localhost:3000/api/quickbase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'test_connection',
        params: {}
      })
    });
    const result1 = await response1.json();
    console.log('✅ Connection test result:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Direct QuickBase API - List Tables
  console.log('2. Testing direct QuickBase API - list_tables:');
  try {
    const response2 = await fetch('http://localhost:3000/api/quickbase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'list_tables',
        params: { appId: 'btfi6y34y' }
      })
    });
    const result2 = await response2.json();
    console.log('✅ List tables result:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Claude AI API - Natural Language Query
  console.log('3. Testing Claude AI API - Natural language query:');
  try {
    const response3 = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all the tables in my QuickBase app',
        context: []
      })
    });
    const result3 = await response3.json();
    console.log('✅ AI response:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Claude AI API - Another Natural Language Query
  console.log('4. Testing Claude AI API - Test connection query:');
  try {
    const response4 = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Can you test my QuickBase connection?',
        context: []
      })
    });
    const result4 = await response4.json();
    console.log('✅ AI response:', JSON.stringify(result4, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIs().then(() => {
  console.log('\nAll tests completed!');
}).catch(error => {
  console.error('Test suite error:', error);
});