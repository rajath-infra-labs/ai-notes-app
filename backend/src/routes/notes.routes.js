// File: src/routes/notes.routes.js
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');

// CRUD routes
router.get('/', notesController.getAllNotes);       // GET /api/notes
router.get('/:id', notesController.getNote);       // GET /api/notes/:id
router.post('/', notesController.createNote);      // POST /api/notes
router.put('/:id', notesController.updateNote);    // PUT /api/notes/:id
router.delete('/:id', notesController.deleteNote);// DELETE /api/notes/:id

// AI enhance route
router.post('/:id/enhance', notesController.enhanceNote); // POST /api/notes/:id/enhance

// Optional extra routes
router.post('/word/meaning', notesController.getWordMeaning); // POST /api/notes/word/meaning
router.get('/subtitles', notesController.getVideoSubtitles); // GET /api/notes/subtitles
router.post('/feedback', notesController.submitFeedback);     // POST /api/notes/feedback

module.exports = router;
