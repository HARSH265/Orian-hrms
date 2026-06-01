require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const logger = require('../utils/logger');
(async () => {
  try {
    const resp = await axios.post('http://localhost:5004/api/auth/login', {
      email: 'admin@example.com',
      password: 'Password123!'
    });
    logger.info('Status:', resp.status);
    logger.info('Data:', resp.data);
  } catch (err) {
    if (err.response) {
      logger.error('Error status:', err.response.status);
      logger.error('Error data:', err.response.data);
    } else {
      logger.error('Error', err.message);
    }
  }
})();
