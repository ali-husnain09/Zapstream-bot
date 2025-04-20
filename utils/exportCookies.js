import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("Exporting YouTube cookies...");

try {
  // Try to use yt-dlp's built-in cookie extractor
  execSync('yt-dlp --cookies-from-browser chrome -o "cookies.txt"');
  console.log("Successfully exported cookies from Chrome");
} catch (error) {
  console.error("Failed to export cookies automatically:", error.message);
  console.log("\nPlease follow these steps to manually export cookies:");
  console.log('1. Install the "Get cookies.txt" extension for Chrome');
  console.log("2. Go to youtube.com and make sure you are logged in");
  console.log("3. Click the extension icon and export cookies");
  console.log('4. Save the file as "cookies.txt" in the bot directory');
}

// Check if cookies file exists
if (fs.existsSync("cookies.txt")) {
  console.log(
    "\nCookies file found! The bot should now work with YouTube videos."
  );
} else {
  console.log("\nNo cookies file found. Please export cookies manually.");
}
