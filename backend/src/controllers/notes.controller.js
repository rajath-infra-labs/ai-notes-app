const { pool } = require('../db/postgres');
const aiService = require('../services/ai.service');
const subtitleService = require('../services/subtitle.service');
const logger = require('../utils/logger');

const notesController = {
  // Create new note
  async createNote(req, res) {
    try {
      const { userId, videoUrl, title, topic, rawText } = req.body;

      // Create or get video record
      const videoResult = await pool.query(
        'INSERT INTO videos (url, title) VALUES ($1, $2) ON CONFLICT (url) DO UPDATE SET url = EXCLUDED.url RETURNING id',
        [videoUrl, title || 'Untitled Video']
      );
      const videoId = videoResult.rows[0].id;

      // Create note
      const noteResult = await pool.query(
        'INSERT INTO notes (user_id, video_id, title, topic) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId || 1, videoId, title, topic]
      );
      const noteId = noteResult.rows[0].id;

      // Create first version
      await pool.query(
        'INSERT INTO note_versions (note_id, raw_text, ai_text) VALUES ($1, $2, $3)',
        [noteId, rawText, null]
      );

      res.status(201).json({
        success: true,
        note: noteResult.rows[0]
      });
    } catch (error) {
      logger.error('Create note error:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  },

  // Get note with all versions
  async getNote(req, res) {
    try {
      const { id } = req.params;

      const noteResult = await pool.query(
        `SELECT n.*, v.url as video_url, v.title as video_title
         FROM notes n
         LEFT JOIN videos v ON n.video_id = v.id
         WHERE n.id = $1`,
        [id]
      );

      if (noteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const versionsResult = await pool.query(
        'SELECT * FROM note_versions WHERE note_id = $1 ORDER BY created_at DESC',
        [id]
      );

      res.json({
        note: noteResult.rows[0],
        versions: versionsResult.rows
      });
    } catch (error) {
      logger.error('Get note error:', error);
      res.status(500).json({ error: 'Failed to get note' });
    }
  },

  // Update note
  async updateNote(req, res) {
    try {
      const { id } = req.params;
      const { title, topic, rawText } = req.body;

      // Update note metadata
      await pool.query(
        'UPDATE notes SET title = $1, topic = $2 WHERE id = $3',
        [title, topic, id]
      );

      // Create new version if text changed
      if (rawText) {
        await pool.query(
          'INSERT INTO note_versions (note_id, raw_text) VALUES ($1, $2)',
          [id, rawText]
        );
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Update note error:', error);
      res.status(500).json({ error: 'Failed to update note' });
    }
  },

  // Delete note
  async deleteNote(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM notes WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete note error:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  },

  // Get all notes
  async getAllNotes(req, res) {
    try {
      const result = await pool.query(
        `SELECT n.*, v.url as video_url, v.title as video_title
         FROM notes n
         LEFT JOIN videos v ON n.video_id = v.id
         ORDER BY n.created_at DESC`
      );
      res.json({ notes: result.rows });
    } catch (error) {
      logger.error('Get all notes error:', error);
      res.status(500).json({ error: 'Failed to get notes' });
    }
  },

  // AI enhance note
  async enhanceNote(req, res) {
    try {
      const { id } = req.params;
      const { rawText, videoContext } = req.body;

      // Get AI enhancement
      const enhancedText = await aiService.enhanceNote(rawText, videoContext);

      // Save enhanced version
      await pool.query(
        'INSERT INTO note_versions (note_id, raw_text, ai_text) VALUES ($1, $2, $3)',
        [id, rawText, enhancedText]
      );

      res.json({
        success: true,
        enhancedText
      });
    } catch (error) {
      logger.error('Enhance note error:', error);
      res.status(500).json({ error: 'Failed to enhance note' });
    }
  },

  // Get word meaning
  async getWordMeaning(req, res) {
    try {
      const { word, context } = req.body;
      const meaning = await aiService.getWordMeaning(word, context);
      res.json({ word, meaning });
    } catch (error) {
      logger.error('Word meaning error:', error);
      res.status(500).json({ error: 'Failed to get word meaning' });
    }
  },

  // Get video subtitles
  async getVideoSubtitles(req, res) {
    try {
      const { url } = req.query;
      const subtitles = await subtitleService.getSubtitles(url);
      res.json({ subtitles });
    } catch (error) {
      logger.error('Subtitles error:', error);
      res.status(500).json({ error: 'Failed to get subtitles' });
    }
  },

  // Submit feedback
  async submitFeedback(req, res) {
    try {
      const { message, rating, email } = req.body;
      
      await pool.query(
        'INSERT INTO feedback (message, rating, email) VALUES ($1, $2, $3)',
        [message, rating, email]
      );

      res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
      logger.error('Feedback error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }
};

module.exports = notesController;
