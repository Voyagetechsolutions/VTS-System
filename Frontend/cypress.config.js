const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    video: false,
    env: {
      SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
      TEST_COMPANY_ID: process.env.CYPRESS_TEST_COMPANY_ID,
      TEST_TRIP_ID: process.env.CYPRESS_TEST_TRIP_ID
    }
  },
});

