// Web server for handling Telegram webhooks

// Load required modules
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

// Redis support
const redis = require('redis');

// Bot configuration
const token = process.env.TELEGRAM_BOT_TOKEN;
const developerChatId = process.env.DEVELOPER_CHAT_ID; // Optional: for receiving feedback
if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Unique instance ID for debugging multiple instances
const INSTANCE_ID = crypto.randomBytes(4).toString('hex');
console.log(`Starting Miku Monday Bot instance: ${INSTANCE_ID}`);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Create a bot instance with additional options for better reliability
const bot = new TelegramBot(token, {
  polling: true,
  retryTimeout: 10000, // 10 seconds retry timeout
  restartDelay: 5000, // 5 seconds delay before restart
  request: {
    proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY,
    timeout: 60000, // 60 seconds timeout
  }
});

console.log('Bot instance created with polling enabled');

// Redis client
let redisClient = null;
const REDIS_URL = process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const CHAT_IDS_KEY = 'miku_monday:chat_ids';

// Initialize Redis client
async function initRedis() {
  try {
    if (process.env.REDIS_CONNECTION_STRING) {
      // Build Redis configuration with optional password
      const redisConfig = {
        url: REDIS_URL
      };
      
      // Add password if provided
      if (REDIS_PASSWORD) {
        redisConfig.password = REDIS_PASSWORD;
        console.log('Redis password authentication enabled');
      }
      
      redisClient = redis.createClient(redisConfig);
      
      redisClient.on('error', (err) => {
        console.error(`Redis Client Error (Instance: ${INSTANCE_ID}):`, err);
      });
      
      await redisClient.connect();
      console.log(`Connected to Redis at ${REDIS_URL}${REDIS_PASSWORD ? ' with authentication' : ''}`);
    } else {
      console.log('No REDIS_CONNECTION_STRING provided, using file-based storage');
    }
  } catch (error) {
    console.error(`Failed to connect to Redis (Instance: ${INSTANCE_ID}):`, error);
    redisClient = null;
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping bot...');
  try {
    // Increase timeout for shutdown operations
    const shutdownTimeout = setTimeout(() => {
      console.log('Shutdown timeout reached, forcing exit...');
      process.exit(1);
    }, 10000); // 10 second timeout
    
    if (bot) {
      console.log('Stopping bot polling...');
      await bot.stopPolling();
      console.log('Bot polling stopped');
    }
    
    if (redisClient) {
      console.log('Disconnecting Redis client...');
      await redisClient.quit();
      console.log('Redis client disconnected');
    }
    
    // Clear the timeout since we completed successfully
    clearTimeout(shutdownTimeout);
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping bot...');
  try {
    // Increase timeout for shutdown operations
    const shutdownTimeout = setTimeout(() => {
      console.log('Shutdown timeout reached, forcing exit...');
      process.exit(1);
    }, 10000); // 10 second timeout
    
    if (bot) {
      console.log('Stopping bot polling...');
      await bot.stopPolling();
      console.log('Bot polling stopped');
    }
    
    if (redisClient) {
      console.log('Disconnecting Redis client...');
      await redisClient.quit();
      console.log('Redis client disconnected');
    }
    
    // Clear the timeout since we completed successfully
    clearTimeout(shutdownTimeout);
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

// Additional cleanup on exit
process.on('exit', () => {
  console.log('Process exiting, final cleanup...');
});

// Log polling status periodically
setInterval(async () => {
  console.log(`Bot polling status check (Instance: ${INSTANCE_ID})...`);
  // Periodically save chat IDs to ensure persistence
  await saveChatIds();
}, 30000); // Every 30 seconds

// Store chat IDs to send GIFs to
let chatIds = new Set();

// File to persist chat IDs (fallback when Redis is not available)
const CHAT_IDS_FILE = 'chat_ids.json';

// Encryption key (in production, this should come from environment variables)
const ENCRYPTION_KEY = process.env.CHAT_IDS_ENCRYPTION_KEY || 'default-key-change-in-production';
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

// Encrypt data
function encrypt(text) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data
function decrypt(text) {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Load chat IDs from Redis or file
async function loadChatIds() {
  try {
    // Try Redis first if available
    if (redisClient) {
      try {
        const encryptedData = await redisClient.get(CHAT_IDS_KEY);
        if (encryptedData) {
          const decryptedData = decrypt(encryptedData);
          const ids = JSON.parse(decryptedData);
          chatIds = new Set(ids);
          console.log(`Loaded ${chatIds.size} chat IDs from Redis`);
          return;
        } else {
          console.log('No existing chat IDs found in Redis, starting with empty set');
        }
      } catch (redisError) {
        console.error('Error loading chat IDs from Redis:', redisError);
      }
    }
    
    // Fallback to file-based storage
    if (fs.existsSync(CHAT_IDS_FILE)) {
      const encryptedData = fs.readFileSync(CHAT_IDS_FILE, 'utf8');
      const decryptedData = decrypt(encryptedData);
      const ids = JSON.parse(decryptedData);
      chatIds = new Set(ids);
      console.log(`Loaded ${chatIds.size} chat IDs from encrypted file`);
    } else {
      console.log('No existing chat IDs file found, starting with empty set');
      // Create an empty chat IDs file
      await saveChatIds();
    }
  } catch (error) {
    console.error('Error loading chat IDs from encrypted file:', error);
    chatIds = new Set(); // Reset to empty set on error
    // Try to create a new empty file
    try {
      await saveChatIds();
    } catch (saveError) {
      console.error('Error creating initial chat IDs file:', saveError);
    }
  }
}

// Save chat IDs to Redis or file
async function saveChatIds() {
  try {
    const idsArray = Array.from(chatIds);
    const jsonData = JSON.stringify(idsArray, null, 2);
    const encryptedData = encrypt(jsonData);
    
    // Try Redis first if available
    if (redisClient) {
      try {
        await redisClient.set(CHAT_IDS_KEY, encryptedData);
        console.log(`Saved ${chatIds.size} chat IDs to Redis`);
        return;
      } catch (redisError) {
        console.error('Error saving chat IDs to Redis:', redisError);
      }
    }
    
    // Fallback to file-based storage
    fs.writeFileSync(CHAT_IDS_FILE, encryptedData);
    console.log(`Saved ${chatIds.size} chat IDs to encrypted file`);
  } catch (error) {
    console.error('Error saving chat IDs to encrypted file:', error);
  }
}

// Load chat IDs on startup
initRedis().then(async () => {
  // Clear webhook to prevent 409 conflicts
  try {
    console.log('Attempting to clear webhook...');
    await bot.deleteWebHook();
    console.log('Webhook cleared, starting polling...');
  } catch (err) {
    console.error('Error clearing webhook:', err);
  }
  
  await loadChatIds();
});

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
async function handleCommand(chatId, messageText, isChannel = false) {
  console.log('=== HANDLING COMMAND ===');
  console.log(`Handling command: chatId=${chatId}, messageText=${messageText}, isChannel=${isChannel}`);
  console.log(`Message text type: ${typeof messageText}`);
  console.log(`Message text value: "${messageText}"`);
  
  // Add chat ID to our set
  const sizeBefore = chatIds.size;
  chatIds.add(chatId);
  
  // Save chat IDs if we added a new one
  if (chatIds.size > sizeBefore) {
    await saveChatIds();
    console.log(`New chat ID added and saved: ${chatId}`);
  }
  
  // Normalize message text by trimming whitespace
  const normalizedText = messageText ? messageText.trim() : '';
  console.log(`Normalized text: "${normalizedText}"`);
  
  if (normalizedText === '/start' || (isChannel && normalizedText && normalizedText.startsWith('/start'))) {
    const welcomeMessage = `👋 Hello! I'm the Miku Monday Bot!

I'll send a Hatsune Miku GIF every Monday at 8:00 AM Singapore Time (12:00 AM UTC).

Type /help to see all available commands.`;
    if (isChannel) {
      // Send a confirmation message to the channel
      bot.sendMessage(chatId, `✅ Miku Monday Bot registered!

I'll send a Hatsune Miku GIF every Monday at 12:00 AM.

Channels subscribed: ${chatIds.size}`).catch((error) => {
        console.error(`Failed to send message to channel ${chatId}:`, error.message);
      });
    } else {
      bot.sendMessage(chatId, welcomeMessage).catch((error) => {
        console.error(`Failed to send message to chat ${chatId}:`, error.message);
      });
    }
  } else if (normalizedText === '/help' || (isChannel && normalizedText === '/help')) {
    const nextMonday = getNextMonday();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = nextMonday.toLocaleDateString('en-US', options);
    
    if (isChannel) {
      bot.sendMessage(chatId, `🤖 Miku Monday Bot Help 🤖

I automatically send a Hatsune Miku GIF every Monday at 8:00 AM Singapore Time (12:00 AM UTC) to all channels I'm added to.
I also send daily hype messages at 8:00 AM Singapore Time with day-specific content to build anticipation for Miku Monday!

Available Commands:
/start - Register this channel/chat with the bot
/help - Show this help message
/status - Show bot status and next scheduled post
/countdown - Show time remaining until next Miku Monday
/unsubscribe - Remove this channel from bot subscriptions
/feedback - Send feedback to the developer`).catch((error) => {
        console.error(`Failed to send help message to channel ${chatId}:`, error.message);
      });
    } else {
      bot.sendMessage(chatId, `I'm Miku Monday Bot! 🎵

Commands:
/start - Welcome message
/help - This help message
/status - Show subscription status
/countdown - Time until next Miku Monday
/feedback - Send feedback to the developer
/listchannels - List subscribed channels (dev only)

I'll automatically send a Miku GIF every Monday at 12:00 AM to all channels I'm added to.`).catch((error) => {
        console.error(`Failed to send help message to chat ${chatId}:`, error.message);
      });
    }
  } else if (normalizedText === '/status' || (isChannel && normalizedText === '/status')) {
    const nextMonday = getNextMonday();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = nextMonday.toLocaleDateString('en-US', options);
    
    if (isChannel) {
      bot.sendMessage(chatId, `📊 Miku Monday Bot Status 📊

I'll automatically send a Miku GIF every Monday at 8:00 AM Singapore Time (12:00 AM UTC) to all channels I'm added to.

Channels subscribed: ${chatIds.size}
Next scheduled post: Monday 8:00 AM (${formattedDate})

To unsubscribe this channel, use the /unsubscribe command.`).catch((error) => {
        console.error(`Failed to send status message to channel ${chatId}:`, error.message);
      });
    } else {
      bot.sendMessage(chatId, `📊 Miku Monday Bot Status

Channels subscribed: ${chatIds.size}
Next scheduled post: Monday 12:00 AM (${formattedDate})

Visit https://its-miku-monday.zeabur.app/status for detailed status information.`).catch((error) => {
        console.error(`Failed to send status message to chat ${chatId}:`, error.message);
      });
    }
  } else if (normalizedText === '/countdown') {
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
${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`).catch((error) => {
      console.error(`Failed to send countdown message to ${isChannel ? 'channel' : 'chat'} ${chatId}:`, error.message);
    });
  } else if (normalizedText === '/feedback') {
    bot.sendMessage(chatId, `📬 Feedback for Miku Monday Bot:

Please send your feedback, bug reports, or suggestions to @JulianC97 on Telegram.

You can also type your message after /feedback and I'll forward it to the developer!`).catch((error) => {
      console.error(`Failed to send feedback message to ${isChannel ? 'channel' : 'chat'} ${chatId}:`, error.message);
    });
  } else if (normalizedText && normalizedText.startsWith('/feedback ')) {
    const feedback = normalizedText.substring(9); // Remove '/feedback '
    bot.sendMessage(chatId, `Thank you for your feedback! I've forwarded your message to the developer.`).catch((error) => {
      console.error(`Failed to send feedback confirmation to ${isChannel ? 'channel' : 'chat'} ${chatId}:`, error.message);
    });
    
    // Send feedback to developer if chat ID is configured
    if (developerChatId) {
      bot.sendMessage(developerChatId, `📬 New feedback received:

From ${isChannel ? 'channel' : 'chat'}: ${chatId}
Message: ${feedback}`).catch((error) => {
        console.error(`Failed to send feedback to developer ${developerChatId}:`, error.message);
      });
    } else {
      console.log(`Feedback received from ${chatId}: ${feedback}`);
      console.log('Note: DEVELOPER_CHAT_ID not set, feedback not sent to developer.');
    }
  } else if (normalizedText === '/listchannels') {
    // Only allow developer to list channels
    if (developerChatId && chatId.toString() === developerChatId.toString()) {
      // Mask channel IDs for privacy (show only last 4 digits)
      const channelList = Array.from(chatIds).map(id => {
        const maskedId = id.toString().slice(-4).padStart(id.toString().length, '*');
        return `• ${maskedId}`;
      }).join('\n') || 'No channels subscribed';
      bot.sendMessage(chatId, `📋 Subscribed Channels:

${channelList}

Total: ${chatIds.size} channels`).catch((error) => {
        console.error(`Failed to send channel list to developer ${chatId}:`, error.message);
      });
    } else {
      bot.sendMessage(chatId, `🔐 This command is restricted to the bot developer only.

🔒 Privacy Notice: Channel information is protected and masked even from the developer.
Only the last 4 digits of channel IDs are visible (e.g., ********1234).`).catch((error) => {
        console.error(`Failed to send restricted access message to ${chatId}:`, error.message);
      });
    }
  } else if (normalizedText === '/unsubscribe') {
    // Check if this is a private chat (not a channel)
    if (!isChannel) {
      bot.sendMessage(chatId, `❌ Unsubscribe Error
        
You can only unsubscribe channels from the bot, not private chats. 

To remove the bot from a channel:
1. Go to your channel settings
2. Select "Administrators" 
3. Remove the Miku Monday Bot as an administrator

If you wish to stop receiving direct messages, you can simply ignore them or block the bot.`).catch((error) => {
          console.error(`Failed to send unsubscribe error message to chat ${chatId}:`, error.message);
        });
      } else {
        // Handle channel unsubscription
        if (chatIds.has(chatId)) {
          chatIds.delete(chatId);
          
          // Save updated chat IDs
          saveChatIds().then(() => {
            bot.sendMessage(chatId, `✅ Successfully Unsubscribed
            
This channel has been unsubscribed from Miku Monday Bot.
You will no longer receive Miku GIFs or daily hype messages here.

To resubscribe in the future, simply send /start@itsmikumondaybot`).catch((error) => {
              console.error(`Failed to send unsubscribe confirmation to channel ${chatId}:`, error.message);
            });
          }).catch((error) => {
            console.error('Error saving chat IDs after unsubscription:', error);
            bot.sendMessage(chatId, `⚠️ Unsubscription Notice
            
This channel has been unsubscribed from Miku Monday Bot, but there was an error saving the change. Please contact the bot developer if this issue persists.`).catch((error) => {
              console.error(`Failed to send unsubscribe notice to channel ${chatId}:`, error.message);
            });
          });
        } else {
          bot.sendMessage(chatId, `ℹ️ Not Subscribed
            
This channel is not currently subscribed to Miku Monday Bot.
No changes were made.`).catch((error) => {
            console.error(`Failed to send not subscribed message to channel ${chatId}:`, error.message);
          });
        }
      }
    }
  // Note: No default response to avoid spamming channels
}// Log when bot is ready
bot.on('polling_start', () => {
  console.log(`=== BOT POLLING STARTED (Instance: ${INSTANCE_ID}) ===`);
  console.log('Bot is now actively polling for messages');
});

console.log('Bot initialized successfully!');
console.log('Bot token (first 10 chars):', token.substring(0, 10));

// Test if bot can send messages
console.log('Testing bot message sending capability...');

// Test network connectivity to Telegram
const https = require('https');
const url = 'https://api.telegram.org';

https.get(url, (res) => {
  console.log(`Network test (Instance: ${INSTANCE_ID}) - Connected to Telegram API. Status: ${res.statusCode}`);
}).on('error', (err) => {
  console.error(`Network test (Instance: ${INSTANCE_ID}) - Failed to connect to Telegram API:`, err.message);
});

// Schedule the bot to send the GIF every Monday at 12:00 AM UTC (8:00 AM Singapore Time)
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
        caption: 'Dev is testing Miku GIF! 🎉\nPlease ignore this message.'
      }).then(() => {
        console.log(`✅ Test Miku GIF sent successfully to chat ${chatId}!`);
      }).catch((error) => {
        console.error(`❌ Error sending test Miku GIF to chat ${chatId}:`, error.message);
      });
    });
  });
}

// Schedule daily hype messages (runs at 8:00 AM every day)
cron.schedule('0 8 * * *', () => {
  console.log('Sending daily hype message to all channels...');
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Create day-specific hype messages
  const hypeMessages = [
    `🎵 Sunday Hype! 🎵

Rest, reflect, and prepare the next melody. 
Tomorrow is Miku Monday!`,
    `🎉 IT'S MIKU MONDAY! 🎉

New week, new track—press play.`,
    `🔥 Tuesday Momentum 🔥

Momentum builds; keep the tempo steady. 
6 more days to Miku Monday.`,
    `🎼 Wednesday Rhythm 🎼

Halfway there—your rhythm is holding strong. 
5 more days to Miku Monday.`,
    `🎯 Thursday Focus 🎯

Fine-tune the details; clarity creates impact. 
4 more days to Miku Monday.`,
    `✨ Friday Finish ✨

Finish with confidence; let the chorus hit. 
3 more days to Miku Monday.`,
    `🎸 Saturday Freedom 🎸

Create freely—no schedule, just sound. 
2 more days to Miku Monday.`
  ];
  
  // Get the appropriate message for today
  const hypeMessage = `${hypeMessages[dayOfWeek]}

Channels subscribed: ${chatIds.size}`;
  
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
bot.on('message', async (msg) => {
  console.log(`=== RECEIVED MESSAGE (Instance: ${INSTANCE_ID}) ===`);
  console.log('Message timestamp:', new Date().toISOString());
  console.log('Message object:', JSON.stringify(msg, null, 2));
  
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  console.log(`Processing message: chatId=${chatId}, messageText=${messageText}`);
  await handleCommand(chatId, messageText, false);
  console.log('Finished processing message');
});


// Handle incoming channel posts
bot.on('channel_post', async (msg) => {
  console.log(`=== RECEIVED CHANNEL POST (Instance: ${INSTANCE_ID}) ===`);
  console.log('Channel post timestamp:', new Date().toISOString());
  console.log('Channel post object:', JSON.stringify(msg, null, 2));
  
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  console.log(`Processing channel post: chatId=${chatId}, messageText=${messageText}`);
  await handleCommand(chatId, messageText, true);
  console.log('Finished processing channel post');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Miku Monday Bot is running!');
});

// Status endpoint
app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// API endpoint for status data
app.get('/api/status', (req, res) => {
  try {
    const statusData = {
      online: true,
      channelCount: chatIds.size,
      nextPost: 'Monday at 8:00 AM (Singapore Time)',
      dailyHype: '8:00 AM (Singapore Time) with day-specific content',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
    
    res.json(statusData);
  } catch (error) {
    console.error('Error fetching status data:', error);
    res.status(500).json({ error: 'Failed to fetch status data' });
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error(`=== POLLING ERROR (Instance: ${INSTANCE_ID}) ===`);
  console.error('Timestamp:', new Date().toISOString());
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  
  // If it's a request error, provide more details
  if (error.response) {
    console.error('Response status:', error.response.statusCode);
    console.error('Response body:', error.response.body);
  }
  
  if (error.options) {
    console.error('Request options:', JSON.stringify(error.options, null, 2));
  }
  
  console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  console.error('====================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Close DB connections, flush logs, etc.
  process.exit(1);
});

// Start the server
app.listen(port, () => {
  console.log(`Miku Monday Bot server (Instance: ${INSTANCE_ID}) running on port ${port}`);
  console.log(`Webhook URL: /bot${token}`);
  console.log('Server started successfully!');
});

module.exports = app;