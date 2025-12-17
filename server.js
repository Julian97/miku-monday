// Web server for handling Telegram webhooks
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const path = require('path');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const developerChatId = process.env.DEVELOPER_CHAT_ID; // Optional: for receiving feedback

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

// Helper function to get next Monday date
function getNextMonday() {
  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

// Serve static files
app.use(express.static('public'));

// Shared command handler function
function handleCommand(chatId, messageText, isChannel = false) {
  // Add chat ID to our set
  chatIds.add(chatId);
  
  if (messageText === '/start' || (isChannel && messageText && messageText.startsWith('/start'))) {
    if (isChannel) {
      // Send a confirmation message to the channel
      bot.sendMessage(chatId, `✅ Miku Monday Bot registered!

I'll send a Hatsune Miku GIF every Monday at 12:00 AM.

Channels subscribed: ${chatIds.size}`);
    } else {
      bot.sendMessage(chatId, `Hello! Welcome to Miku Monday Bot! 🎉

I'll automatically send a Hatsune Miku GIF every Monday at 12:00 AM.

Just add me to your Telegram channels as an administrator and I'll start sending GIFs there!

Current channels subscribed: ${chatIds.size}`);
    }
  } else if (messageText === '/help' || messageText === '/status' || (isChannel && (messageText === '/help' || messageText === '/status'))) {
    const nextMonday = getNextMonday();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = nextMonday.toLocaleDateString('en-US', options);
    
    if (isChannel) {
      bot.sendMessage(chatId, `I'm Miku Monday Bot! 🎵

I'll send a Hatsune Miku GIF every Monday at 12:00 AM.

Channels subscribed: ${chatIds.size}
Next scheduled post: Monday 12:00 AM (${formattedDate})`);
    } else {
      bot.sendMessage(chatId, `I'm Miku Monday Bot! 🎵

Commands:
/start - Welcome message
/help - This help message
/status - Show subscription status
/countdown - Time until next Miku Monday
/feedback - Send feedback to the developer
/listchannels - List subscribed channels (dev only)

I'll automatically send a Miku GIF every Monday at 12:00 AM to all channels I'm added to.`);
    }
  } else if (messageText === '/countdown') {
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    nextMonday.setHours(0, 0, 0, 0);
    
    const timeDiff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    bot.sendMessage(chatId, `⏰ Countdown to next Miku Monday:
${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
  } else if (messageText === '/feedback') {
    bot.sendMessage(chatId, `📬 Feedback for Miku Monday Bot:

Please send your feedback, bug reports, or suggestions to @JulianC97 on Telegram.

You can also type your message after /feedback and I'll forward it to the developer!`);
  } else if (messageText && messageText.startsWith('/feedback ')) {
    const feedback = messageText.substring(9); // Remove '/feedback '
    bot.sendMessage(chatId, `Thank you for your feedback! I've forwarded your message to the developer.`);
    
    // Send feedback to developer if chat ID is configured
    if (developerChatId) {
      bot.sendMessage(developerChatId, `📬 New feedback received:

From ${isChannel ? 'channel' : 'chat'}: ${chatId}
Message: ${feedback}`);
    } else {
      console.log(`Feedback received from ${chatId}: ${feedback}`);
      console.log('Note: DEVELOPER_CHAT_ID not set, feedback not sent to developer.');
    }
  } else if (messageText === '/listchannels') {
    // Only allow developer to list channels
    if (developerChatId && chatId.toString() === developerChatId.toString()) {
      // Mask channel IDs for privacy (show only last 4 digits)
      const channelList = Array.from(chatIds).map(id => {
        const maskedId = id.toString().slice(-4).padStart(id.toString().length, '*');
        return `• ${maskedId}`;
      }).join('\n') || 'No channels subscribed';
      bot.sendMessage(chatId, `📋 Subscribed Channels:

${channelList}

Total: ${chatIds.size} channels`);
    } else {
      bot.sendMessage(chatId, `🔐 This command is restricted to the bot developer only.`);
    }
  }
  // Note: No default response to avoid spamming channels
}

// Webhook route
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Schedule the bot to send the GIF every Monday at 12:00 AM (00:00)
cron.schedule('0 0 * * 1', () => {
  console.log('Sending Miku GIF to all channels...');
  
  // Send GIF to all registered chat IDs
  chatIds.forEach(chatId => {
    bot.sendAnimation(chatId, mikuGifPath, {
      caption: 'Happy Miku Monday! 🎉\nHave a great week with Hatsune Miku! 🎵'
    }).then(() => {
      console.log(`✅ Miku GIF sent successfully to chat ${chatId}!`);
    }).catch((error) => {
      console.error(`❌ Error sending Miku GIF to chat ${chatId}:`, error.message);
    });
  });
});

// Also schedule for testing purposes (every minute in development)
if (process.env.NODE_ENV === 'development') {
  cron.schedule('* * * * *', () => {
    console.log('Sending test Miku GIF to all channels...');
    
    chatIds.forEach(chatId => {
      bot.sendAnimation(chatId, mikuGifPath, {
        caption: 'Test Miku GIF! 🎉'
      }).then(() => {
        console.log(`✅ Test Miku GIF sent successfully to chat ${chatId}!`);
      }).catch((error) => {
        console.error(`❌ Error sending test Miku GIF to chat ${chatId}:`, error.message);
      });
    });
  });
}

// Schedule daily hype messages (runs at 12:00 PM every day)
cron.schedule('0 12 * * *', () => {
  console.log('Sending daily hype message to all channels...');
  
  // Calculate days until next Monday
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  
  // Create hype message
  let hypeMessage;
  if (daysUntilMonday === 1) {
    hypeMessage = `🎉 Tomorrow is Miku Monday! 🎉

Get ready for some Hatsune Miku magic! 🎵

Channels subscribed: ${chatIds.size}`;
  } else {
    hypeMessage = `📣 ${daysUntilMonday} days until Miku Monday! 📣

Building hype for the weekly Hatsune Miku celebration! 🎵

Channels subscribed: ${chatIds.size}`;
  }
  
  // Send hype message to all registered chat IDs
  chatIds.forEach(chatId => {
    bot.sendMessage(chatId, hypeMessage).then(() => {
      console.log(`✅ Daily hype message sent successfully to chat ${chatId}!`);
    }).catch((error) => {
      console.error(`❌ Error sending daily hype message to chat ${chatId}:`, error.message);
    });
  });
});

// Handle incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  handleCommand(chatId, messageText, false);
});


// Handle incoming channel posts
bot.on('channel_post', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  handleCommand(chatId, messageText, true);
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