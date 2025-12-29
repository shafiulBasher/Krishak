// Simple test to verify backend setup
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend test successful!',
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
});
