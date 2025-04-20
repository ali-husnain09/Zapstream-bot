export const startCommand = async (sock, jid) => {
  try {
    await sock.sendMessage(jid, {
      text: `👋 *Welcome to Social Media Video Downloader Bot!*\n\n*Available Commands:*\n\n📥 *Download Videos:*\n/yt [link] - Download YouTube video\n/fb [link] - Download Facebook video\n/insta [link] - Download Instagram video\n\nℹ️ *Other Commands:*\n/help - Show help menu\n/info - Show bot information\n\n*How to Download:*\n1. Send a command with video link (e.g., /yt https://youtube.com/watch?v=example)\n2. Bot will download and send the video directly to this chat\n3. For large videos, the bot will automatically compress them\n\n⚠️ *Note:* Make sure to send the video link immediately after the command.`,
    });
  } catch (error) {
    console.error("Error in start command:", error);
    throw new Error("Failed to send welcome message");
  }
};
