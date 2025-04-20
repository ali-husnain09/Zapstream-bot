import { YouTubeDownloader } from "../downloaders/youtube.js";
import { FacebookDownloader } from "../downloaders/facebook.js";
import { InstagramDownloader } from "../downloaders/instagram.js";
import { isLink, getPlatform } from "../utils/isLink.js";
import { config } from "../config/env.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { promisify } from "util";
import path from "path";

const stat = promisify(fs.stat);

export const downloadCommand = async (sock, jid, platform, url) => {
  try {
    // Validate URL
    if (!isLink(url)) {
      await sock.sendMessage(jid, {
        text: "❌ Invalid URL. Please provide a valid video link.",
      });
      return;
    }

    // Verify platform
    const detectedPlatform = getPlatform(url);
    if (detectedPlatform !== platform) {
      await sock.sendMessage(jid, {
        text: `❌ Invalid platform. This URL appears to be from ${
          detectedPlatform || "an unsupported platform"
        }`,
      });
      return;
    }

    // Send initial message
    await sock.sendMessage(jid, {
      text: "⏳ Processing your request...",
    });

    let downloader;
    switch (platform) {
      case "youtube":
        downloader = YouTubeDownloader;
        break;
      case "facebook":
        downloader = FacebookDownloader;
        break;
      case "instagram":
        downloader = InstagramDownloader;
        break;
      default:
        throw new Error("Invalid platform");
    }

    // Get video info
    const info = await downloader.getVideoInfo(url);
    await sock.sendMessage(jid, {
      text: `📥 Downloading: ${info.title}\n⏱ Duration: ${info.duration} seconds`,
    });

    // Download video
    const result = await downloader.download(url);

    if (result.needsCompression) {
      await sock.sendMessage(jid, {
        text: "⚠️ Video is too large. Compressing...",
      });

      const compressedPath = path.join(
        config.download.tempDir,
        `compressed_${Date.now()}.mp4`
      );
      await new Promise((resolve, reject) => {
        ffmpeg(result.path)
          .outputOptions([
            `-c:v ${config.compression.videoCodec}`,
            `-crf ${config.compression.crf}`,
            `-preset ${config.compression.preset}`,
            `-c:a ${config.compression.audioCodec}`,
            `-b:a ${config.compression.audioBitrate}`,
          ])
          .on("end", resolve)
          .on("error", reject)
          .save(compressedPath);
      });

      // Send compressed video
      await sock.sendMessage(jid, {
        video: { url: compressedPath },
        caption: `✅ ${info.title}\n\n📊 Original size: ${result.size.toFixed(
          2
        )}MB\n🔄 Compressed for WhatsApp`,
      });

      // Clean up
      fs.unlinkSync(compressedPath);
    } else {
      // Send original video
      await sock.sendMessage(jid, {
        video: { url: result.path },
        caption: `✅ ${info.title}\n\n📊 Size: ${result.size.toFixed(2)}MB`,
      });
    }

    // Clean up
    fs.unlinkSync(result.path);
  } catch (error) {
    console.error("Download error:", error);
    await sock.sendMessage(jid, {
      text: `❌ Error: ${error.message}\n\nPlease try again or contact support if the problem persists.`,
    });
  }
};
