
const isProduction = process.env.NODE_ENV === 'production';

// Set your URLs here
export const API_BASE_URL = isProduction 
  ? 'https://ydhomescleaning.yencodetechnologies.in/api'
  : 'http://localhost:2081/api';

// export const API_BASE_URL = 'http://192.168.100.233:5001/api';