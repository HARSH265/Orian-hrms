require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
(async () => {
  try {
    const resp = await axios.post('http://localhost:5004/api/auth/login', {
      email: 'admin@example.com',
      password: 'Password123!'
    });
    console.log('Status:', resp.status);
    console.log('Data:', resp.data);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', err.response.data);
    } else {
      console.error('Error', err.message);
    }
  }
})();
