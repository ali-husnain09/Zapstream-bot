# 🔥 ZapStream Bot

A blazing-fast, always-online WhatsApp AI bot that downloads and delivers social media videos (YouTube, Facebook, Instagram) directly in the chat. Built with **Baileys**, **Node.js**, and deployed on **Railway** for non-stop performance.

---

## 🚀 Features

- ✅ WhatsApp connection using Baileys
- 📥 Paste any YouTube, Facebook, or Instagram link to get the video directly in chat
- 🤖 Smart auto-replies and link detection
- ⚡ Fast video delivery with big file support
- 🗑️ Videos are auto-deleted after 5 minutes to save space
- ☁️ No local storage – supports Supabase or other cloud storage
- ♻️ Automatic reconnection on internet failure
- 🌐 24/7 deployment via Railway

---

## 📦 Tech Stack

- Node.js
- Baileys (WhatsApp library)
- ytdl-core / downloader APIs
- Supabase (for cloud-based session storage)
- Railway (for deployment)

---

## 📚 Dependencies

The following NPM packages are required and will be auto-installed:

```bash
npm install
```

## 🛠️ Setup Instructions

1. Clone or Fork the Repository
```bash
git clone https://github.com/ali-husnain09/zapstream-bot.git
cd zapstream-bot
```
2. Install Dependencies
```bash
npm install
```

Run the Bot Locally (First Time Only)

```bash
node index.js
```
## 💡 How to Use
Open WhatsApp

- Send the bot any valid YouTube, Facebook, or Instagram video link
- Bot responds in chat with the video directly
- After 5 minutes, the video file is deleted to save space

## 📢 Bot Commands
The bot supports the following commands:


Command	Usage Example	Description
``/start	 ```/start	                     - Welcomes the user and gives instructions
/yt	/yt https://youtube.com/watch?v=abc123	   - Downloads and sends a YouTube video
/fb	/fb https://facebook.com/video123	         - Downloads and sends a Facebook video
/insta	/insta https://instagram.com/reel/xyz	 - Downloads and sends an Instagram reel/video
