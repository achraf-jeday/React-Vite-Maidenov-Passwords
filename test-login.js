// Test script to verify login functionality with Vite proxy
// This script simulates the login request that the LoginForm component makes

async function testLogin() {
  console.log('Testing login with Vite proxy...');

  try {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: 'test-frontend',
      client_secret: 'test-secret-key-12345',
      username: 'admin',
      password: 'admin',
      scope: 'basic'
    });

    console.log('Making login request to /oauth/token via proxy...');

    const response = await fetch('/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Access token:', data.access_token ? 'Received' : 'Missing');
      console.log('Refresh token:', data.refresh_token ? 'Received' : 'Missing');
      console.log('Expires in:', data.expires_in || 'Not set');

      // Store tokens like the LoginForm does
      if (data.access_token) {
        localStorage.setItem('maidenov_access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('maidenov_refresh_token', data.refresh_token);
      }
      if (data.expires_in) {
        const expiresAt = Date.now() + (data.expires_in * 1000);
        localStorage.setItem('maidenov_token_expires_at', expiresAt.toString());
      }

      console.log('Tokens stored in localStorage');
      return true;
    } else {
      console.log('❌ Login failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Run the test
testLogin().then(success => {
  console.log('Test result:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
});