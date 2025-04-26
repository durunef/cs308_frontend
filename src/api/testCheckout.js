// Test script to help diagnose checkout issues
// Run this in the browser console to debug checkout API issues

(async function() {
  // Sample order data
  const orderData = {
    shippingDetails: {
      fullName: "Test User",
      email: "test@example.com",
      address: "123 Test St",
      city: "TestCity",
      state: "State",
      zipCode: "12345",
      country: "USA",
      phone: "5555555555"
    },
    paymentDetails: {
      cardNumber: "4111111111111111",
      cardName: "Test User",
      expiryDate: "12/25",
      cvv: "123"
    }
  };

  // Get authentication token
  const token = localStorage.getItem('token');
  console.log('Current token:', token ? `${token.substring(0, 15)}...` : 'Not found');

  // Test the checkout endpoint
  try {
    console.log('Sending test checkout request...');
    const response = await fetch('http://localhost:3000/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(orderData)
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Checkout Success! Order ID:', data.data?.orderId);
    } else {
      console.error('❌ Checkout Failed');
      console.error('Response:', data);
    }
  } catch (error) {
    console.error('❌ Error during test checkout:', error);
  }
})(); 