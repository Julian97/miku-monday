# Miku Monday Bot

A Telegram bot that automatically posts a Hatsune Miku GIF every Monday at 12:00 AM.

## Features

- Automatically sends a Miku GIF every Monday at 12:00 AM
- Customizable GIF URL
- Easy setup with environment variables
- Test mode for development

## Setup Instructions

1. **Create a Telegram Bot:**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the instructions to create a new bot
   - Copy the bot token provided by BotFather

2. **Get Your Chat ID:**
   - You can get your personal chat ID by sending a message to your bot and checking the logs
   - Or use [@userinfobot](https://t.me/userinfobot) to get your chat ID
   - For group chats, you'll need to invite the bot to the group and send a message

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`:
     ```
     cp .env.example .env
     ```
   - Edit `.env` and replace the placeholder values:
     ```
     TELEGRAM_BOT_TOKEN=your_actual_bot_token
     TELEGRAM_CHAT_ID=your_chat_id
     ```

4. **Install Dependencies:**
   ```
   npm install
   ```

5. **Run the Bot:**
   ```
   npm start
   ```

## Development

For testing purposes, you can enable development mode by setting:
```
NODE_ENV=development
```

In development mode, the bot will send a GIF every minute instead of every Monday.

## Customization

You can customize the GIF by setting the `MIKU_GIF_PATH` environment variable to any local GIF file path. By default, the bot uses `./its-miku-monday.gif`.

## Deployment

To keep the bot running continuously, you can deploy it on platforms like:
- Heroku
- Railway
- Render
- Zeabur
- Any VPS with Node.js support

### Deploying on Zeabur (Recommended)

If you're deploying on Zeabur:
1. Follow the detailed [Zeabur Deployment Guide](ZEABUR_DEPLOYMENT.md)
2. Once deployed, other users can simply search for your bot by username and add it to their channels

Make sure to set the environment variables in your deployment platform.

### For Other Users

Once you've deployed the bot, other users can easily add it to their channels without any technical setup:
1. Search for your bot by username in Telegram
2. Click "Start" or send `/start`
3. Add the bot to their channels as an administrator

They don't need to create their own bot or set up hosting!

For detailed instructions, see the [User Guide](USER_GUIDE.md).

## License

MIT