import qrcode from "qrcode-terminal";

import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  getContentType,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import P from "pino";
import axios from "axios";
import ytdlp from "yt-dlp-exec";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { promisify } from "util";
import { config } from "./config/env.js";
import { startCommand } from "./commands/start.js";
import { downloadCommand } from "./commands/download.js";

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = [
    config.download.authDir,
    config.download.downloadDir,
    config.download.tempDir,
    path.join(config.download.downloadDir, "youtube"),
    path.join(config.download.downloadDir, "facebook"),
    path.join(config.download.downloadDir, "instagram"),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Logger configuration
const logger = P({
  level: process.env.NODE_ENV === "development" ? "debug" : "silent",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

let retryCount = 0;
const MAX_RETRIES = 5;
let sock = null;

const clearAuthAndRetry = async () => {
  console.log("Clearing auth data and retrying connection...");
  try {
    if (fs.existsSync(config.download.authDir)) {
      fs.rmSync(config.download.authDir, { recursive: true, force: true });
    }
    retryCount = 0;
    setTimeout(connectToWhatsApp, 1000);
  } catch (error) {
    console.error("Error clearing auth:", error);
    process.exit(1);
  }
};

const connectToWhatsApp = async () => {
  try {
    ensureDirectories();
    console.log("Initializing WhatsApp connection...");

    const { state, saveCreds } = await useMultiFileAuthState(
      path.resolve(config.download.authDir)
    );

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(
      "Using WhatsApp Web version:",
      version,
      "| Is latest:",
      isLatest
    );

    // Create socket with updated configuration
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      qrTimeout: 0,
      logger: P({ level: "silent" }),
      browser: Browsers.appropriate("Chrome"),
      version,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
      maxRetries: 5,
      authTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      linkPreviewMs: 0,
      fireInitQueries: true,
      generateHighQualityLinkPreview: false,
      emitOwnEvents: false,
      customUploadHosts: [],
      getMessage: async (key) => ({
        conversation: "An Error Occurred. Ignore this.",
      }),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("🔄 QR code received. Generating in terminal...");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `Connection closed due to ${
            lastDisconnect?.error?.message || "unknown error"
          }`,
          `\nStatus code: ${statusCode}`,
          `\nReconnecting: ${shouldReconnect}`
        );

        if (statusCode === 405 || statusCode === 428) {
          console.log("Received error, clearing auth and retrying...");
          await clearAuthAndRetry();
          return;
        }

        if (shouldReconnect) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            console.log(
              `Retrying connection in ${
                delay / 1000
              } seconds... (Attempt ${retryCount}/${MAX_RETRIES})`
            );
            setTimeout(connectToWhatsApp, delay);
          } else {
            console.log(
              "Max retries reached. Clearing auth and trying one last time..."
            );
            await clearAuthAndRetry();
          }
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log("Device logged out, clearing auth and retrying...");
          await clearAuthAndRetry();
        }
      } else if (connection === "connecting") {
        console.log("Connecting to WhatsApp...");
      } else if (connection === "open") {
        console.log("Successfully connected to WhatsApp!");
        retryCount = 0;
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const messageText =
        msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const jid = msg.key.remoteJid;

      try {
        if (messageText.startsWith("/")) {
          const [command, ...args] = messageText.split(" ");
          const url = args[0];

          switch (command.toLowerCase()) {
            case "/start":
              await startCommand(sock, jid);
              break;

            case "/yt":
              if (!url) {
                await sock.sendMessage(jid, {
                  text: "❌ Please provide a YouTube URL.\nExample: /yt https://youtube.com/watch?v=example",
                });
                return;
              }
              await downloadCommand(sock, jid, "youtube", url);
              break;

            case "/fb":
              if (!url) {
                await sock.sendMessage(jid, {
                  text: "❌ Please provide a Facebook URL.\nExample: /fb https://facebook.com/video/example",
                });
                return;
              }
              await downloadCommand(sock, jid, "facebook", url);
              break;

            case "/insta":
              if (!url) {
                await sock.sendMessage(jid, {
                  text: "❌ Please provide an Instagram URL.\nExample: /insta https://instagram.com/p/example",
                });
                return;
              }
              await downloadCommand(sock, jid, "instagram", url);
              break;

            case "/help":
              await sock.sendMessage(jid, {
                text: `*📚 Help Menu*\n\n*Download Commands:*\n/yt [link] - Download YouTube video\n/fb [link] - Download Facebook video\n/insta [link] - Download Instagram video\n\n*Other Commands:*\n/start - Start the bot\n/help - Show this help message\n/info - Show bot information\n\n*Note:* Videos will be downloaded and sent directly to this chat. Large videos will be automatically compressed.\n\n*Usage Example:*\n/yt https://youtube.com/watch?v=example`,
              });
              break;

            case "/info":
              await sock.sendMessage(jid, {
                text: `*🤖 Bot Information*\n\n• Version: 1.0.0\n• Platform: WhatsApp\n• Features:\n  - High-quality video downloads\n  - Support for multiple platforms\n  - Automatic video compression\n  - Fast and reliable service\n\n*Note:* This bot is for personal use only.`,
              });
              break;

            default:
              await sock.sendMessage(jid, {
                text: "❌ Unknown command. Type /help to see available commands.",
              });
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
        try {
          await sock.sendMessage(jid, {
            text: "❌ An error occurred while processing your request. Please try again later.",
          });
        } catch (sendError) {
          console.error("Error sending error message:", sendError);
        }
      }
    });
  } catch (error) {
    console.error("Error in connection:", error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(
        `Retrying in ${
          delay / 1000
        } seconds... (Attempt ${retryCount}/${MAX_RETRIES})`
      );
      setTimeout(connectToWhatsApp, delay);
    } else {
      console.log(
        "Max retries reached. Clearing auth and trying one last time..."
      );
      await clearAuthAndRetry();
    }
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down bot...");
  if (sock) {
    try {
      await sock.logout();
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (reason === 1006) {
    console.log("Connection error detected, attempting to reconnect...");
    clearAuthAndRetry();
  }
});

console.log("Starting WhatsApp bot...");
connectToWhatsApp();
