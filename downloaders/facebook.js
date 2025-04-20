import ytdlp from "yt-dlp-exec";
import { config } from "../config/env.js";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const stat = promisify(fs.stat);

export class FacebookDownloader {
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
      outputPath = path.join(tempDir, `facebook_${timestamp}.mp4`);

      // Download with more detailed options
      await ytdlp(url, {
        output: outputPath,
        format: "best[ext=mp4]/best",
        mergeOutputFormat: "mp4",
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: [
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
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
      console.error("Facebook download error:", error);
      // Clean up partial file if it exists
      if (outputPath && fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          console.error("Error cleaning up partial file:", cleanupError);
        }
      }
      throw new Error(`Facebook download failed: ${error.message}`);
    }
  }

  static async getVideoInfo(url) {
    try {
      const info = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificates: true,
        addHeader: [
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
      });

      return {
        title: info.title || "Facebook Video",
        duration: info.duration || "Unknown",
        thumbnail: info.thumbnail || null,
        description: info.description || "",
      };
    } catch (error) {
      console.error("Facebook info error:", error);
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }
}
