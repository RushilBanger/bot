const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route to start the bot
app.post('/start', (req, res) => {
  const botProcess = exec('node bot.js');

  botProcess.stdout.on('data', (data) => console.log(data.toString()));
  botProcess.stderr.on('data', (data) => console.error(data.toString()));

  res.send('🟢 Bot started.');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
