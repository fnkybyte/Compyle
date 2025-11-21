const assert = require('assert');
const fetch = require('node-fetch');

async function runHealthCheckTest() {
  console.log('Running health check test...');
  try {
    const response = await fetch('http://localhost:3001/api/v1/health');
    assert.strictEqual(response.status, 200, 'Health check should return status 200');

    const body = await response.json();
    assert.strictEqual(body.status, 'ok', 'Health check response should have status "ok"');
    assert.ok(body.timestamp, 'Health check response should have a timestamp');

    console.log('✅ Health check test passed!');
  } catch (error) {
    console.error('❌ Health check test failed:', error.message);
    process.exit(1);
  }
}

runHealthCheckTest();
