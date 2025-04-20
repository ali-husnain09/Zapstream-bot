export const config = {
  // WhatsApp bot configuration
  whatsapp: {
    browser: ["WhatsApp Bot", "Chrome", "120.0.0.0"],
    version: [2, 2323, 4],
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
    getMessage: async (key) => {
      return {
        conversation: "An Error Occurred. Ignore this.",
      };
    },
    // Additional connection settings
    connect: {
      timeout: 60000,
      retries: 5,
      delay: 2000,
    },
    // WebSocket settings
    ws: {
      timeout: 60000,
      keepAliveInterval: 15000,
      maxRetries: 5,
    },
  },

  // Download configuration
  download: {
    authDir: "./auth",
    tempDir: "./temp",
    maxFileSize: 16 * 1024 * 1024, // 16MB in bytes
    downloadDir: "./downloads",
  },

  // Video compression settings
  compression: {
    videoCodec: "libx264",
    crf: 28,
    preset: "medium",
    audioCodec: "aac",
    audioBitrate: "128k",
  },
};
