# Miku Monday Bot

A Telegram bot that automatically posts a Hatsune Miku GIF every Monday at 12:00 AM to Telegram channels. Designed for easy deployment on cloud platforms like Zeabur, allowing non-technical users to simply add the bot to their channels without any complex setup.

## Features

- Automatically sends a Miku GIF every Monday at 12:00 AM
- Sends daily hype messages to build anticipation
- Works with multiple Telegram channels
- No technical setup required for end users
- Completely free and open source
- Webhook-based architecture for efficient cloud deployment
- Interactive command interface for user engagement
- Feedback system for user-developer communication
- Health monitoring endpoints
- Automatic channel registration system

## For Users

You can easily add it to your Telegram channels or have the bot private DM you:

1. Search for the bot @itsmikumondaybot in Telegram, or through https://t.me/itsmikumondaybot
2. Click "Start" or send `/start`
3. Add the bot to your Telegram channels as an administrator
4. Send `/start@itsmikumondaybot` to register your channel to the bot

That's it! The bot will automatically send a Miku GIF every Monday at 12:00 AM to your channels.

For detailed instructions, see the [User Guide](USER_GUIDE.md).

## Bot Commands

- `/start` - Welcome message and instructions
- `/help` - Show help information
- `/status` - Show bot status, subscription info, and next scheduled post date
- `/countdown` - Show time remaining until next Miku Monday
- `/feedback` - Send feedback to the developer (@JulianC97)

## Technical Implementation

### Core Components
- **Telegram Integration**: Uses `node-telegram-bot-api` for Telegram bot functionality
- **Web Framework**: Built with Express.js for webhook handling and health endpoints
- **Scheduling**: Uses `node-cron` for timing the weekly GIF posts
- **Environment Management**: Uses `dotenv` for configuration management
- **File Handling**: Sends locally stored GIF animations to channels

### Architecture
- **Webhook-based**: Designed for Zeabur deployment without polling
- **Event Handling**: Processes both private messages and channel posts
- **Chat ID Tracking**: Maintains a set of registered channel IDs
- **Health Monitoring**: Includes health check endpoints
- **Privacy Protection**: Implements encrypted storage for chat IDs and masked output for developer commands
- **Persistent Storage**: Supports both Redis and file-based storage for chat ID persistence

### Deployment
- **Platform**: Optimized for Zeabur cloud deployment
- **Environment Variables**: Configurable through environment variables
- **Static Assets**: Serves static HTML files for web interface
- **Production Ready**: Clean client-facing distribution without development files
- **Redis Support**: Optional Redis storage for persistent chat ID management across deployments

## Environment Variables

The bot requires the following environment variables:

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from BotFather
- `DEVELOPER_CHAT_ID` - (Optional) Your Telegram chat ID to receive feedback
- `CHAT_IDS_ENCRYPTION_KEY` - (Optional) Encryption key for chat IDs storage (defaults to a default key for development)
- `REDIS_CONNECTION_STRING` - (Optional) Redis connection URL for persistent storage (e.g., `redis://localhost:6379`)

In production environments (like Zeabur), set these variables in your deployment platform's environment settings rather than using a .env file.

## Developer Features

### Admin Commands
- `/listchannels` - Lists all subscribed channels with masked IDs for privacy protection

### Privacy & Security
- **Encrypted Storage**: Chat IDs are stored in an encrypted file using AES-256-CBC
- **Masked Output**: Even developers only see masked channel IDs (e.g., ********1234)
- **Environment Isolation**: Sensitive keys are managed through environment variables
- **Secure Configuration**: Production keys never committed to the repository

## License

MIT