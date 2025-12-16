// Script to help set up Telegram webhook
require('dotenv').config();
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.ZEABUR_URL || 'https://your-zeabur-url.zeabur.app';

if (!token) {
  console.error('Please set TELEGRAM_BOT_TOKEN in your environment variables');
  process.exit(1);
}

if (!baseUrl || baseUrl === 'https://your-zeabur-url.zeabur.app') {
  console.error('Please set ZEABUR_URL in your environment variables to your actual Zeabur URL');
  process.exit(1);
}

const webhookUrl = `${baseUrl}/bot${token}`;

async function setWebhook() {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url: webhookUrl
    });
    
    if (response.data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`Webhook URL: ${webhookUrl}`);
      console.log('Your bot is now ready to receive updates from Telegram.');
    } else {
      console.error('❌ Failed to set webhook:', response.data.description);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

async function getWebhookInfo() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    
    if (response.data.ok) {
      console.log('Current Webhook Info:');
      console.log(JSON.stringify(response.data.result, null, 2));
    } else {
      console.error('Failed to get webhook info:', response.data.description);
    }
  } catch (error) {
    console.error('Error getting webhook info:', error.message);
  }
}

async function deleteWebhook() {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`);
    
    if (response.data.ok) {
      console.log('✅ Webhook deleted successfully!');
    } else {
      console.error('❌ Failed to delete webhook:', response.data.description);
    }
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.message);
  }
}

// Command line arguments
const args = process.argv.slice(2);

if (args.includes('--info')) {
  getWebhookInfo();
} else if (args.includes('--delete')) {
  deleteWebhook();
} else {
  setWebhook();
}