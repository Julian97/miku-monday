# Zeabur Deployment Guide for Miku Monday Bot

This guide will help you deploy the Miku Monday bot on Zeabur so that other users can easily add it to their Telegram channels.

## Prerequisites

1. A Telegram Bot Token (obtained from @BotFather)
2. A Zeabur account (https://zeabur.com)
3. This project repository

## Deployment Steps

### 1. Create Your Bot with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Choose a name for your bot (e.g., "Miku Monday Bot")
4. Choose a username for your bot (e.g., `miku_monday_bot` or `MikuMondayBot`)
5. Copy the bot token provided by BotFather - you'll need this for deployment

### 2. Deploy to Zeebur

1. Go to [Zeabur](https://zeabur.com) and sign in or create an account
2. Click "New Service"
3. Choose "Deploy your own source code"
4. Connect your GitHub/GitLab account or upload the project files
5. Select this project repository
6. In the service configuration:
   - Set the **Build Command** to: `npm install`
   - Set the **Start Command** to: `npm start`
   - Set the **Port** to: `3000` (or any available port)
7. Add environment variables:
   - `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
   - `NODE_ENV`: production
8. Deploy the service

### 3. Get Your Bot URL (for webhook)

After deployment, Zeabur will provide you with a URL for your service. You'll need this to set up the Telegram webhook.

### 4. Set Up Webhook with Telegram

Telegram needs to know where to send updates. Run this URL in your browser (replace `YOUR_BOT_TOKEN` and `YOUR_ZEEBUR_URL`):

```
https://api.telegram.org/bot[YOUR_BOT_TOKEN]/setWebhook?url=[YOUR_ZEEBUR_URL]/bot[YOUR_BOT_TOKEN]
```

Example:
```
https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook?url=https://your-service-lnxmhw.zeebur.app/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### 5. Share Your Bot with Others

Once deployed, others can simply:
1. Search for your bot by username in Telegram
2. Click "Start" or "/start"
3. Add the bot to their channels as an administrator

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (required)
- `NODE_ENV`: Set to "production" for production deployment
- `MIKU_GIF_PATH`: Path to the GIF file (defaults to "./its-miku-monday.gif")

## Troubleshooting

1. If the bot isn't responding:
   - Check that the webhook is properly set up
   - Verify your bot token is correct
   - Check Zeabur logs for errors

2. If the GIF isn't sending:
   - Make sure the GIF file is included in the deployment
   - Check file permissions

## Scaling

The bot is designed to handle multiple channels automatically. Each channel the bot is added to will receive the Miku GIF every Monday.