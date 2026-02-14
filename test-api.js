const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...\n');
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    try {
      const health = await axios.get('http://localhost:5000/api/v1/health');
      console.log('✅ Health check:', health.status === 200 ? 'OK' : 'FAIL');
    } catch (e) {
      console.log('❌ Health check failed:', e.message);
    }
    
    // Test 2: Login (need credentials)
    console.log('\n2️⃣ Testing login endpoint...');
    try {
      // Using default admin credentials from seed
      const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: 'admin@church.com',
        password: 'Admin123!'
      });
      console.log('✅ Login successful');
      const token = loginResponse.data.data.accessToken;
      
      // Test 3: Get programs with token
      console.log('\n3️⃣ Testing GET /programs...');
      try {
        const programsResponse = await axios.get('http://localhost:5000/api/v1/programs?limit=20&page=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ GET /programs:', programsResponse.status, '- Total:', programsResponse.data.data.length);
      } catch (e) {
        console.log('❌ GET /programs failed:', e.response ? `${e.response.status} - ${e.response.data.message}` : e.message);
      }
      
      // Test 4: Delete all programs
      console.log('\n4️⃣ Testing DELETE /programs/all...');
      try {
        const deleteResponse = await axios.delete('http://localhost:5000/api/v1/programs/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ DELETE /programs/all:', deleteResponse.status, '-', deleteResponse.data.message);
      } catch (e) {
        console.log('❌ DELETE /programs/all failed:', e.response ? `${e.response.status} - ${e.response.data.message}` : e.message);
      }
      
    } catch (e) {
      console.log('❌ Login failed:', e.response ? `${e.response.status} - ${e.response.data.message}` : e.message);
      console.log('Cannot test authenticated endpoints without login');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
