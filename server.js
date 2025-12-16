// Web server for handling Telegram webhooks
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in environment variables');
  process.exit(1);
}

// Create a bot instance that uses webhooks
const bot = new TelegramBot(token);

// Store chat IDs to send GIFs to
let chatIds = new Set();

// Path to the Miku GIF
const mikuGifPath = process.env.MIKU_GIF_PATH || './its-miku-monday.gif';

// Serve static files
app.use(express.static('public'));

// Webhook route
app.post(`/bot${token}`, (req, res) => {
  console.log('📥 Webhook received update:', JSON.stringify(req.body, null, 2));
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Schedule the bot to send the GIF every Monday at 12:00 AM (00:00)
cron.schedule('0 0 * * 1', () => {
  console.log('Sending Miku GIF to all channels...');
  
  // Check if file exists
  if (!fs.existsSync(mikuGifPath)) {
    console.error(`❌ GIF file not found at path: ${mikuGifPath}`);
    return;
  }
  
  // Send GIF to all registered chat IDs
  chatIds.forEach(chatId => {
    console.log(`📤 Attempting to send Monday GIF to chat ${chatId}...`);
    bot.sendAnimation(chatId, mikuGifPath, {
      caption: 'Happy Miku Monday! 🎉\nHave a great week with Hatsune Miku! 🎵'
    }).then(() => {
      console.log(`✅ Miku GIF sent successfully to chat ${chatId}!`);
    }).catch((error) => {
      console.error(`❌ Error sending Miku GIF to chat ${chatId}:`, error.message);
      if (error.response) {
        console.error(`   Response:`, JSON.stringify(error.response, null, 2));
      }
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
    });
  });
});

// Also schedule for testing purposes (every minute in development)
if (process.env.NODE_ENV === 'development') {
  cron.schedule('* * * * *', () => {
    console.log('Sending test Miku GIF to all channels...');
    
    // Check if file exists before attempting to send
    const fs = require('fs');
    if (!fs.existsSync(mikuGifPath)) {
      console.error(`❌ GIF file not found at path: ${mikuGifPath}`);
      return;
    }
    
    console.log(`✅ GIF file found at: ${mikuGifPath}`);
    console.log(`📁 File size: ${fs.statSync(mikuGifPath).size} bytes`);
    
    chatIds.forEach(chatId => {
      console.log(`📤 Attempting to send GIF to chat ${chatId}...`);
      bot.sendAnimation(chatId, mikuGifPath, {
        caption: 'Test Miku GIF! 🎉'
      }).then(() => {
        console.log(`✅ Test Miku GIF sent successfully to chat ${chatId}!`);
      }).catch((error) => {
        console.error(`❌ Error sending test Miku GIF to chat ${chatId}:`, error.message);
        if (error.response) {
          console.error(`   Response:`, JSON.stringify(error.response, null, 2));
        }
        if (error.code) {
          console.error(`   Error code: ${error.code}`);
        }
      });
    });
  });
}

// Handle incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  // Add chat ID to our set
  chatIds.add(chatId);
  console.log(`Added chat ID: ${chatId}`);
  
  if (messageText === '/start') {
    bot.sendMessage(chatId, `Hello! Welcome to Miku Monday Bot! 🎉

I'll automatically send a Hatsune Miku GIF every Monday at 12:00 AM.

Just add me to your Telegram channels as an administrator and I'll start sending GIFs there!

Current channels subscribed: ${chatIds.size}`);
  } else if (messageText === '/help') {
    bot.sendMessage(chatId, `I'm Miku Monday Bot! 🎵\n\nCommands:\n/start - Welcome message\n/help - This help message\n/status - Show subscription status\n\nI'll automatically send a Miku GIF every Monday at 12:00 AM to all channels I'm added to.`);
  } else if (messageText === '/status') {
    bot.sendMessage(chatId, `Miku Monday Bot Status:\n- Channels subscribed: ${chatIds.size}\n- Next scheduled post: Monday 12:00 AM\n- GIF file: ${mikuGifPath}`);
  } else {
    bot.sendMessage(chatId, `I'm Miku Monday Bot! 🎵\n\nI'll automatically send a Hatsune Miku GIF every Monday at 12:00 AM to this channel.\n\nSend /help for more information.`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Miku Monday Bot is running!');
});

// Status endpoint
app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Miku Monday Bot server running on port ${port}`);
  console.log(`Webhook URL: /bot${token}`);
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code);
});

module.exports = app;