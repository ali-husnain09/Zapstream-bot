/**
 * Validates if a given string is a valid URL for supported platforms
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid, false otherwise
 */
export const isLink = (url) => {
  try {
    // Basic URL validation
    new URL(url);

    // Platform-specific URL patterns
    const platformPatterns = {
      youtube: [
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/.+/,
      ],
      facebook: [
        /^(https?:\/\/)?(www\.)?facebook\.com\/.+\/videos\/.+/,
        /^(https?:\/\/)?(www\.)?fb\.watch\/.+/,
      ],
      instagram: [
        /^(https?:\/\/)?(www\.)?instagram\.com\/p\/.+/,
        /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/.+/,
      ],
    };

    // Check if URL matches any platform pattern
    return Object.values(platformPatterns).some((patterns) =>
      patterns.some((pattern) => pattern.test(url))
    );
  } catch (error) {
    return false;
  }
};

/**
 * Determines the platform of a given URL
 * @param {string} url - The URL to check
 * @returns {string|null} - The platform name or null if not supported
 */
export const getPlatform = (url) => {
  if (!isLink(url)) return null;

  const platformPatterns = {
    youtube: [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/.+/,
    ],
    facebook: [
      /^(https?:\/\/)?(www\.)?facebook\.com\/.+\/videos\/.+/,
      /^(https?:\/\/)?(www\.)?fb\.watch\/.+/,
    ],
    instagram: [
      /^(https?:\/\/)?(www\.)?instagram\.com\/p\/.+/,
      /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/.+/,
    ],
  };

  for (const [platform, patterns] of Object.entries(platformPatterns)) {
    if (patterns.some((pattern) => pattern.test(url))) {
      return platform;
    }
  }

  return null;
};
