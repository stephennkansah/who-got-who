/**
 * Input validation utilities to prevent crashes from invalid user input
 */

/**
 * Validate game ID format
 */
export const isValidGameId = (gameId: string): boolean => {
  // Game IDs should be 6 characters, alphanumeric, uppercase
  return /^[A-Z0-9]{6}$/.test(gameId);
};

/**
 * Validate player name
 */
export const isValidPlayerName = (name: string): boolean => {
  // Name should be 1-20 characters, no special characters except spaces, hyphens, apostrophes
  const trimmed = name.trim();
  return trimmed.length >= 1 && 
         trimmed.length <= 20 && 
         /^[a-zA-Z0-9\s\-']+$/.test(trimmed);
};

/**
 * Sanitize player name for safety
 */
export const sanitizePlayerName = (name: string): string => {
  return name.trim()
    .replace(/[^a-zA-Z0-9\s\-']/g, '') // Remove invalid chars
    .substring(0, 20) // Limit length
    .trim(); // Trim again after processing
};

/**
 * Sanitize game ID for safety
 */
export const sanitizeGameId = (gameId: string): string => {
  return gameId.toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove invalid chars
    .substring(0, 6); // Limit length
};

/**
 * Validate email format (for feedback)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate text input length and content
 */
export const isValidTextInput = (text: string, maxLength: number = 1000): boolean => {
  const trimmed = text.trim();
  return trimmed.length >= 1 && trimmed.length <= maxLength;
};

/**
 * Sanitize text input for safety
 */
export const sanitizeTextInput = (text: string, maxLength: number = 1000): string => {
  return text.trim()
    .replace(/[<>]/g, '') // Remove potentially dangerous HTML chars
    .substring(0, maxLength)
    .trim();
};

/**
 * Validate avatar emoji
 */
export const isValidEmojiAvatar = (avatar: string): boolean => {
  // Check if it's a single emoji (roughly)
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
  return emojiRegex.test(avatar) && avatar.length <= 4;
};

/**
 * Validate image data URL for photo avatars
 */
export const isValidImageDataUrl = (dataUrl: string): boolean => {
  if (!dataUrl.startsWith('data:image/')) return false;
  
  // Check reasonable size limits (base64 encoded images under ~500KB)
  if (dataUrl.length > 700000) return false;
  
  // Check for valid image types
  const validTypes = ['data:image/jpeg', 'data:image/png', 'data:image/webp'];
  return validTypes.some(type => dataUrl.startsWith(type));
};

/**
 * Comprehensive input validation for creating/joining games
 */
export interface GameInputValidation {
  isValid: boolean;
  errors: string[];
  sanitizedValues: {
    playerName?: string;
    gameId?: string;
    avatar?: string;
  };
}

export const validateGameInput = (
  playerName: string,
  gameId?: string,
  avatar?: string
): GameInputValidation => {
  const errors: string[] = [];
  const sanitizedValues: any = {};

  // Validate player name
  if (!playerName || !isValidPlayerName(playerName)) {
    errors.push('Player name must be 1-20 characters and contain only letters, numbers, spaces, hyphens, and apostrophes');
  } else {
    sanitizedValues.playerName = sanitizePlayerName(playerName);
  }

  // Validate game ID if provided (for joining)
  if (gameId !== undefined) {
    if (!gameId || !isValidGameId(gameId)) {
      errors.push('Game ID must be exactly 6 uppercase letters and numbers');
    } else {
      sanitizedValues.gameId = sanitizeGameId(gameId);
    }
  }

  // Validate avatar if provided
  if (avatar !== undefined) {
    if (avatar.startsWith('data:image/')) {
      if (!isValidImageDataUrl(avatar)) {
        errors.push('Avatar image is invalid or too large');
      } else {
        sanitizedValues.avatar = avatar;
      }
    } else {
      if (!isValidEmojiAvatar(avatar)) {
        errors.push('Avatar emoji is invalid');
      } else {
        sanitizedValues.avatar = avatar;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValues
  };
};

/**
 * Rate limiting for form submissions
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const createRateLimiter = () => new RateLimiter();