const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = config.anthropicApiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async enhanceNote(rawText, videoContext = '') {
    // If no API key, return mock response
    if (!this.apiKey || this.apiKey === 'your_api_key_here' || this.apiKey === '') {
      logger.warn('No API key configured, returning mock enhancement');
      return this.mockEnhancement(rawText);
    }

    try {
      const prompt = `You are a helpful note-taking assistant. The user has written quick notes while watching a video. Your task is to:

1. Correct grammar and spelling
2. Organize the notes with clear headings based on the video topic
3. Make the notes more readable while preserving all information
4. Add bullet points where appropriate

Video context: ${videoContext}

Raw notes:
${rawText}

Please provide enhanced, well-structured notes.`;

      const response = await axios.post(
        this.baseURL,
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      logger.error('AI enhancement error:', error.response?.data || error.message);
      return this.mockEnhancement(rawText);
    }
  }

  async getWordMeaning(word, context = '') {
    if (!this.apiKey || this.apiKey === 'your_api_key_here' || this.apiKey === '') {
      return `**${word}**: [AI API key not configured. Please add ANTHROPIC_API_KEY to use this feature]`;
    }

    try {
      const prompt = `Provide a clear, concise definition of the word "${word}" as used in this context:

Context: ${context}

Format your response as:
**Word**: Simple definition (1-2 sentences)
*Example*: How it's used in a sentence`;

      const response = await axios.post(
        this.baseURL,
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      logger.error('Word meaning error:', error.response?.data || error.message);
      return `**${word}**: Unable to fetch meaning at this time.`;
    }
  }

  mockEnhancement(rawText) {
    // Simple mock enhancement - capitalize first letter, add basic structure
    const lines = rawText.split('\n').filter(line => line.trim());
    let enhanced = '# Notes\n\n';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        enhanced += `- ${capitalized}\n`;
      }
    });

    enhanced += '\n*[AI enhancement requires API key. Add ANTHROPIC_API_KEY to enable full features]*';
    return enhanced;
  }
}

module.exports = new AIService();
