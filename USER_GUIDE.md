# User Guide: Adding Miku Monday Bot to Your Channels

This guide explains how to add the Miku Monday Bot to your Telegram channels so you can receive weekly Miku GIFs.

## Prerequisites

- A Telegram account
- Access to a Telegram channel where you have admin rights

## Steps to Add the Bot to Your Channel

### 1. Find the Bot

1. Open Telegram
2. Search for the bot by username (@itsmikumondaybot)
3. Click on the bot in the search results

### 2. Start the Bot

1. Click the "Start" button or send `/start` to the bot
2. The bot will send you a welcome message with instructions

### 3. Add the Bot to Your Channel

1. Open your Telegram channel
2. Tap on the channel name at the top to open channel info
3. Tap "Manage Channel" or "Edit"
4. Tap "Administrators"
5. Tap "Add Administrator"
6. Search for the bot's username
7. Select the bot from the search results
8. Grant the necessary permissions:
   - Post messages
   - Edit messages (optional)
9. Tap "Save" or "Done"
10. Send `/start@itsmikumondaybot` to register your channel to the bot

### 4. Confirm Setup

1. The bot should now be added to your channel
2. You can test it by sending `/status` to the bot in a private chat
3. The bot will automatically send a Miku GIF every Monday at 12:00 AM
4. You'll also receive daily hype messages to build anticipation for Miku Monday

## Bot Commands

- `/start` - Welcome message and instructions
- `/help` - Show help information
- `/status` - Show bot status, subscription info, and next scheduled post date
- `/countdown` - Show time remaining until next Miku Monday
- `/feedback` - Send feedback to the developer (@JulianC97)

> **Note:** The bot also sends daily hype messages to build anticipation for Miku Monday!

## Troubleshooting

### If the bot isn't sending GIFs:

1. Check that the bot has the necessary permissions in your channel
2. Make sure the bot hasn't been restricted or banned
3. Verify that the channel is active and not deleted

### If you can't add the bot to your channel:

1. Ensure you have admin rights in the channel
2. Check that the bot is not set to private mode by the owner
3. Make sure you're using the correct bot username

## Privacy and Data

The bot only stores:
- Chat IDs of channels it's added to (needed to send GIFs)
- No personal messages or data are stored
- All data is automatically deleted if the bot is removed from a channel

## Setting Up Feedback (For Developers)

To receive feedback from users directly in Telegram:

1. Find your personal chat ID by sending a message to your bot and checking the chat ID in the logs
2. Set the `DEVELOPER_CHAT_ID` environment variable to your chat ID
3. Users can now send feedback using `/feedback Your message here`
4. You will receive feedback messages directly in your Telegram

## Security Configuration (For Developers)

To enhance security and privacy:

1. Set the `CHAT_IDS_ENCRYPTION_KEY` environment variable to a strong encryption key
2. This will encrypt the stored chat IDs to protect user privacy
3. If not set, a default key will be used (not recommended for production)

## Support

If you encounter any issues, contact the bot owner @JulianC97 for assistance.