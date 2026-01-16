// API Base URL
const API_URL = window.location.origin + '/api/notes';

// State
let currentVideoId = null;
let currentNoteId = null;
let apiKey = localStorage.getItem('anthropic_api_key');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedNotes();
    if (apiKey) {
        document.getElementById('enhanceBtn').disabled = false;
    }
});

// Load video
function loadVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    if (!url) {
        alert('Please enter a YouTube URL');
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        alert('Invalid YouTube URL');
        return;
    }

    currentVideoId = videoId;
    const container = document.getElementById('videoContainer');
    const player = document.getElementById('videoPlayer');
    
    player.src = `https://www.youtube.com/embed/${videoId}`;
    container.classList.remove('hidden');

    // Fetch subtitles for context
    fetchSubtitles(url);
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

async function fetchSubtitles(url) {
    try {
        const response = await fetch(`${API_URL}/video/subtitles?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.subtitles && data.subtitles.text) {
            console.log('Subtitles loaded for AI context');
        }
    } catch (error) {
        console.error('Failed to fetch subtitles:', error);
    }
}

// Save note
async function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const topic = document.getElementById('noteTopic').value.trim();
    const rawText = document.getElementById('noteText').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();

    if (!rawText) {
        alert('Please write some notes first');
        return;
    }

    const noteData = {
        userId: 1,
        videoUrl: videoUrl || 'https://youtube.com/watch?v=demo',
        title: title || 'Quick Notes',
        topic: topic,
        rawText: rawText
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData)
        });

        const result = await response.json();
        if (result.success) {
            currentNoteId = result.note.id;
            alert('Note saved successfully!');
            loadSavedNotes();
        }
    } catch (error) {
        console.error('Failed to save note:', error);
        alert('Failed to save note. Please try again.');
    }
}

// Enhance note with AI
async function enhanceNote() {
    const rawText = document.getElementById('noteText').value.trim();
    
    if (!rawText) {
        alert('Please write some notes first');
        return;
    }

    if (!currentNoteId) {
        alert('Please save the note first');
        return;
    }

    const enhanceBtn = document.getElementById('enhanceBtn');
    enhanceBtn.disabled = true;
    enhanceBtn.textContent = '⏳ Enhancing...';

    try {
        const response = await fetch(`${API_URL}/${currentNoteId}/enhance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': apiKey || ''
            },
            body: JSON.stringify({
                rawText: rawText,
                videoContext: document.getElementById('noteTopic').value
            })
        });

        const result = await response.json();
        
        if (result.success) {
            const enhancedSection = document.getElementById('enhancedSection');
            const enhancedText = document.getElementById('enhancedText');
            
            enhancedText.innerHTML = formatMarkdown(result.enhancedText);
            enhancedSection.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to enhance note:', error);
        alert('Failed to enhance note. Please try again.');
    } finally {
        enhanceBtn.disabled = false;
        enhanceBtn.textContent = '✨ AI Enhance';
    }
}

// Lookup word meaning
async function lookupWord() {
    const word = document.getElementById('lookupWord').value.trim();
    const context = document.getElementById('noteText').value.trim();

    if (!word) {
        alert('Please enter a word to lookup');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/word-meaning`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': apiKey || ''
            },
            body: JSON.stringify({ word, context })
        });

        const result = await response.json();
        
        const meaningDiv = document.getElementById('wordMeaning');
        meaningDiv.innerHTML = formatMarkdown(result.meaning);
        meaningDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to lookup word:', error);
        alert('Failed to lookup word. Please try again.');
    }
}

// Load saved notes
async function loadSavedNotes() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        const notesList = document.getElementById('notesList');
        
        if (data.notes && data.notes.length > 0) {
            notesList.innerHTML = data.notes.map(note => `
                <div class="note-card" onclick="viewNote(${note.id})">
                    <h4>${note.title || 'Untitled Note'}</h4>
                    <p class="note-topic">${note.topic || 'No topic'}</p>
                    <p class="note-date">${new Date(note.created_at).toLocaleDateString()}</p>
                    <p class="note-video">${note.video_title || 'No video'}</p>
                </div>
            `).join('');
        } else {
            notesList.innerHTML = '<p class="empty-state">No notes yet. Start taking notes above!</p>';
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

// View specific note
async function viewNote(noteId) {
    try {
        const response = await fetch(`${API_URL}/${noteId}`);
        const data = await response.json();
        
        if (data.note) {
            document.getElementById('noteTitle').value = data.note.title || '';
            document.getElementById('noteTopic').value = data.note.topic || '';
            
            if (data.versions && data.versions.length > 0) {
                const latestVersion = data.versions[0];
                document.getElementById('noteText').value = latestVersion.raw_text || '';
                
                if (latestVersion.ai_text) {
                    const enhancedSection = document.getElementById('enhancedSection');
                    const enhancedText = document.getElementById('enhancedText');
                    enhancedText.innerHTML = formatMarkdown(latestVersion.ai_text);
                    enhancedSection.classList.remove('hidden');
                }
            }
            
            if (data.note.video_url) {
                document.getElementById('videoUrl').value = data.note.video_url;
            }
            
            currentNoteId = noteId;
            window.scrollTo(0, 0);
        }
    } catch (error) {
        console.error('Failed to load note:', error);
    }
}

// Submit feedback
async function submitFeedback(event) {
    event.preventDefault();
    
    const message = document.getElementById('feedbackMessage').value.trim();
    const rating = document.getElementById('feedbackRating').value;
    const email = document.getElementById('feedbackEmail').value.trim();

    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, rating, email })
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Thank you for your feedback!');
            document.getElementById('feedbackMessage').value = '';
            document.getElementById('feedbackEmail').value = '';
        }
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    }
}

// Utility functions
function toggleAIFeatures() {
    const section = document.getElementById('apiKeySection');
    section.classList.toggle('hidden');
}

function saveApiKey() {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        localStorage.setItem('anthropic_api_key', key);
        apiKey = key;
        document.getElementById('enhanceBtn').disabled = false;
        alert('API key saved! AI features are now enabled.');
    }
}

function clearNotes() {
    if (confirm('Clear all notes? This will not delete saved notes.')) {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteTopic').value = '';
        document.getElementById('noteText').value = '';
        document.getElementById('enhancedSection').classList.add('hidden');
        currentNoteId = null;
    }
}

function copyEnhanced() {
    const text = document.getElementById('enhancedText').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert('Enhanced notes copied to clipboard!');
    });
}

function formatMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n/g, '<br>');
}
