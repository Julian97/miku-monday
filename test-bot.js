// Test script to verify bot functionality
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// Get bot token and chat ID from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables');
  process.exit(1);
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Path to the Miku GIF to post
const mikuGifPath = process.env.MIKU_GIF_PATH || './its-miku-monday.gif';

console.log('Testing Miku Monday Bot...');

// Send a test message
bot.sendMessage(chatId, '🧪 Testing Miku Monday Bot...')
  .then(() => {
    console.log('✅ Test message sent successfully!');
    
    // Send a test GIF
    return bot.sendAnimation(chatId, mikuGifPath, {
      caption: '🎉 Test Miku GIF!'
    });
  })
  .then(() => {
    console.log('✅ Test GIF sent successfully!');
    console.log('✅ All tests passed!');
    
    // Close the bot
    bot.stopPolling();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during testing:', error);
    
    // Close the bot
    bot.stopPolling();
    process.exit(1);
  });