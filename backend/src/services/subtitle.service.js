const { getSubtitles } = require('youtube-captions-scraper');
const logger = require('../utils/logger');

class SubtitleService {
  async getSubtitles(videoUrl) {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(videoUrl);
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get subtitles (defaults to English)
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: 'en'
      });

      // Combine subtitle text
      const fullText = subtitles
        .map(sub => sub.text)
        .join(' ')
        .replace(/\n/g, ' ')
        .trim();

      return {
        videoId,
        text: fullText,
        subtitles: subtitles
      };
    } catch (error) {
      logger.error('Subtitle fetch error:', error);
      
      // Return mock data if subtitles unavailable
      return {
        videoId: this.extractVideoId(videoUrl),
        text: 'Subtitles not available for this video. You can still take notes!',
        subtitles: []
      };
    }
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}

module.exports = new SubtitleService();
