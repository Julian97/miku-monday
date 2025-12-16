const fs = require('fs');

// Create package.json content
const packageJson = {
  name: "miku-monday-bot",
  version: "1.0.0",
  description: "A Telegram bot that posts a Miku GIF every Monday at 12 AM",
  main: "index.js",
  scripts: {
    start: "node index.js"
  },
  dependencies: {
    "node-telegram-bot-api": "^0.61.0",
    "node-cron": "^3.0.2"
  },
  keywords: ["telegram", "bot", "miku", "scheduled"],
  author: "Julian97",
  license: "MIT"
};

// Write package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('package.json created successfully!');