const API_BASE_URL = 'http://localhost:5000/api';
let currentSubject = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
});

// Load available subjects
async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`);
        const data = await response.json();
        displaySubjects(data.subjects);
    } catch (error) {
        console.error('Error loading subjects:', error);
        document.getElementById('subjectGrid').innerHTML = 
            '<div class="error">Failed to load subjects. Please check if the server is running.</div>';
    }
}

// Display subjects in grid
function displaySubjects(subjects) {
    const grid = document.getElementById('subjectGrid');
    
    if (subjects.length === 0) {
        grid.innerHTML = `
            <div class="loading" style="grid-column: 1/-1;">
                <i class="fas fa-info-circle"></i>
                <p>No subjects found. Add PDFs to subject_pdfs/ folder</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = subjects.map(subject => `
        <button class="subject-btn" onclick="selectSubject('${subject}')">
            <i class="fas fa-book"></i>
            <span>${subject}</span>
        </button>
    `).join('');
}

// Select subject
function selectSubject(subject) {
    currentSubject = subject;
    document.getElementById('subjectSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'flex';
    document.getElementById('currentSubject').textContent = subject;
    document.getElementById('welcomeSubject').textContent = subject;
    
    // Clear previous messages
    const messages = document.getElementById('chatMessages');
    messages.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-robot"></i>
            <p>Hello! I'm your AI Tutor. Ask me anything about <strong>${subject}</strong>!</p>
        </div>
    `;
    
    // Focus on input
    document.getElementById('userInput').focus();
}

// Select custom subject
function selectCustomSubject() {
    const customSubject = document.getElementById('customSubject').value.trim();
    if (customSubject) {
        selectSubject(customSubject);
        document.getElementById('customSubject').value = '';
    }
}

// Change subject
function changeSubject() {
    currentSubject = null;
    document.getElementById('chatSection').style.display = 'none';
    document.getElementById('subjectSection').style.display = 'block';
    loadSubjects();
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('userInput');
    const query = input.value.trim();
    
    if (!query) return;
    
    if (!currentSubject) {
        alert('Please select a subject first!');
        return;
    }
    
    // Disable input
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    // Add user message to chat
    addMessage(query, 'user');
    
    // Clear input
    input.value = '';
    
    // Show loading
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                subject: currentSubject
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Add bot response
            addBotMessage(data.answer, data.sources, data.videos);
        } else {
            addBotMessage(`Error: ${data.error || 'Something went wrong'}`, [], []);
        }
    } catch (error) {
        console.error('Error:', error);
        addBotMessage(`Connection error: ${error.message}. Please make sure the server is running.`, [], []);
    } finally {
        hideLoading();
        input.disabled = false;
        document.getElementById('sendBtn').disabled = false;
        input.focus();
    }
}

// Add user message
function addMessage(text, type) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${type === 'user' ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-bubble">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Add bot message with sources and videos
function addBotMessage(answer, sources, videos) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let sourcesHtml = '';
    if (sources && sources.length > 0) {
        sourcesHtml = `
            <div class="sources">
                <h4><i class="fas fa-book"></i> Sources</h4>
                <ul>
                    ${sources.map(source => `<li>${escapeHtml(source)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    let videosHtml = '';
    if (videos && videos.length > 0) {
        videosHtml = `
            <div class="videos">
                <h4><i class="fab fa-youtube"></i> Recommended Videos</h4>
                ${videos.map(video => `
                    <div class="video-item">
                        <a href="${video.link}" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-play-circle"></i>
                            <span>${escapeHtml(video.title)}</span>
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                ${formatAnswer(answer)}
                ${sourcesHtml}
                ${videosHtml}
            </div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Format answer (preserve line breaks)
function formatAnswer(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

