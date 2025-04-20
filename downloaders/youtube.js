import ytdlp from "yt-dlp-exec";
import { config } from "../config/env.js";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const stat = promisify(fs.stat);

export class YouTubeDownloader {
  static async download(url) {
    let outputPath = null;
    try {
      // Ensure temp directory exists
      const tempDir = path.resolve(config.download.tempDir);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate a unique filename in temp directory
      const timestamp = Date.now();
      outputPath = path.join(tempDir, `youtube_${timestamp}.mp4`);

      // Download with simplified options
      await ytdlp(url, {
        output: outputPath,
        format: "best[ext=mp4]/best",
        addHeader: [
          "referer:youtube.com",
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
        cookies: "cookies.txt",
        noPlaylist: true,
      });

      // Wait a moment for file system to catch up
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify the file exists and get its size
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Output file not found at ${outputPath}`);
      }

      const stats = await stat(outputPath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      return {
        path: outputPath,
        size: fileSizeInMB,
        needsCompression:
          fileSizeInMB > config.download.maxFileSize / (1024 * 1024),
      };
    } catch (error) {
      console.error("YouTube download error:", error);
      // Clean up partial file if it exists
      if (outputPath && fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          console.error("Error cleaning up partial file:", cleanupError);
        }
      }

      // Handle specific error cases
      if (error.message.includes("Sign in to confirm you're not a bot")) {
        throw new Error(
          "YouTube requires authentication. Please try again later or use a different video."
        );
      } else if (error.message.includes("Video unavailable")) {
        throw new Error(
          "This video is unavailable. It may be private or deleted."
        );
      } else if (error.message.includes("Private video")) {
        throw new Error("This video is private and cannot be downloaded.");
      } else if (error.message.includes("Age restricted")) {
        throw new Error(
          "This video is age-restricted and cannot be downloaded."
        );
      }

      throw new Error(`YouTube download failed: ${error.message}`);
    }
  }

  static async getVideoInfo(url) {
    try {
      const info = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        addHeader: [
          "referer:youtube.com",
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
        cookies: "cookies.txt",
        noPlaylist: true,
      });

      return {
        title: info.title || "YouTube Video",
        duration: info.duration || "Unknown",
        thumbnail: info.thumbnail || null,
        formats: info.formats || [],
        description: info.description || "",
      };
    } catch (error) {
      console.error("YouTube info error:", error);

      // Handle specific error cases
      if (error.message.includes("Sign in to confirm you're not a bot")) {
        throw new Error(
          "YouTube requires authentication. Please try again later or use a different video."
        );
      } else if (error.message.includes("Video unavailable")) {
        throw new Error(
          "This video is unavailable. It may be private or deleted."
        );
      } else if (error.message.includes("Private video")) {
        throw new Error("This video is private and cannot be downloaded.");
      } else if (error.message.includes("Age restricted")) {
        throw new Error(
          "This video is age-restricted and cannot be downloaded."
        );
      }

      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }
}
