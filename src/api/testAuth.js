// Test script to help diagnose authentication issues
// To use this script, copy and paste it into your browser console when logged in

(async function() {
  console.log('🔍 Testing authentication status...');
  
  // Check for token in localStorage
  const token = localStorage.getItem('token');
  console.log('Token in localStorage:', token ? '✓ Present' : '✗ Missing');
  if (token) {
    console.log('Token first 15 chars:', token.substring(0, 15) + '...');
    
    // Validate token format (should be JWT with 3 parts)
    const tokenParts = token.split('.');
    console.log('Token format:', tokenParts.length === 3 ? '✓ Valid JWT format' : '✗ Invalid format');
    
    if (tokenParts.length === 3) {
      try {
        // Decode the payload (middle part) to check expiration
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Decoded payload:', payload);
        
        // Check if token is expired
        if (payload.exp) {
          const expTime = new Date(payload.exp * 1000);
          const now = new Date();
          console.log('Token expires:', expTime.toLocaleString());
          console.log('Token status:', expTime > now ? '✓ Valid' : '✗ EXPIRED');
          
          // Calculate time left
          if (expTime > now) {
            const timeLeft = (expTime - now) / 1000 / 60;
            console.log(`Time remaining: ${Math.floor(timeLeft)} minutes`);
          }
        }
        
        // Check if user ID is present
        console.log('User ID in token:', payload.id ? `✓ ${payload.id}` : '✗ Missing');
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }
  
  // Check for user data in localStorage
  const userData = localStorage.getItem('user');
  console.log('User data in localStorage:', userData ? '✓ Present' : '✗ Missing');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('User data:', user);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Test backend connection with token
  if (token) {
    try {
      console.log('Testing API connection...');
      const response = await fetch('http://localhost:3000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Authentication working! Response:', data);
      } else {
        console.error('❌ API request failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error testing authentication:', error);
    }
  }
  
  // If you've made it this far and still have issues, suggest solutions
  console.log('\n🔧 Potential solutions if you have authentication issues:');
  console.log('1. Log out and log in again to refresh your token');
  console.log('2. Clear browser cache/cookies and try again');
  console.log('3. Check that backend server is running (http://localhost:3000)');
  console.log('4. Ensure your user has an address in their profile');
})(); 