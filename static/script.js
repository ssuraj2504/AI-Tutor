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
        document.getElementById('subjectGrid').innerHTML = '<p>No subjects found. Make sure the backend is running.</p>';
    }
}

// Display subjects in grid
function displaySubjects(subjects) {
    const subjectGrid = document.getElementById('subjectGrid');
    subjectGrid.innerHTML = '';

    if (!subjects || subjects.length === 0) {
        subjectGrid.innerHTML = '<p>No subjects available yet.</p>';
        return;
    }

    subjects.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'subject-btn';
        btn.onclick = () => selectSubject(subject);

        const iconMap = {
            'Mathematics': 'fas fa-calculator',
            'Physics': 'fas fa-atom',
            'Chemistry': 'fas fa-flask',
            'Biology': 'fas fa-dna',
            'History': 'fas fa-book-open',
            'Literature': 'fas fa-feather',
            'Programming': 'fas fa-code',
            'Web Development': 'fas fa-globe',
            'Data Science': 'fas fa-chart-bar',
            'AI': 'fas fa-robot'
        };

        const icon = iconMap[subject] || 'fas fa-book';

        btn.innerHTML = `
            <i class="${icon}"></i>
            <span>${subject}</span>
        `;

        subjectGrid.appendChild(btn);
    });
}

// Select a subject and show chat view
function selectSubject(subject) {
    currentSubject = subject;
    
    document.getElementById('currentSubjectName').textContent = subject;
    document.getElementById('subjectView').classList.remove('active-view');
    document.getElementById('chatView').classList.add('active-view');
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-sparkles"></i>
            <h3>Welcome to ${subject}</h3>
            <p>Ask anything about this subject. I'll provide detailed answers with sources.</p>
        </div>
    `;

    document.getElementById('messageInput').focus();
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) return;

    messageInput.value = '';
    addMessageToChat('user', message);
    showLoadingIndicator();

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject: currentSubject,
                query: message
            })
        });
        let data;
        try {
            data = await response.json();
        } catch (err) {
            removeLoadingIndicator();
            addMessageToChat('bot', 'Connection error. Make sure backend is running.');
            scrollChatToBottom();
            return;
        }

        removeLoadingIndicator();

        if (!response.ok) {
            const errMsg = data && data.error ? data.error : 'Sorry, I encountered an error. Please try again.';
            addMessageToChat('bot', errMsg);
            scrollChatToBottom();
            return;
        }

        if (data.answer) {
            const responseContent = document.createElement('div');
            responseContent.innerHTML = formatResponse(data.answer);

            addMessageToChat('bot', responseContent.innerHTML);

            if (data.sources && data.sources.length > 0) {
                addSourcesToLastMessage(data.sources);
            }

            if (data.videos && data.videos.length > 0) {
                addVideosToLastMessage(data.videos);
            }
        } else if (data.error) {
            addMessageToChat('bot', data.error);
        } else {
            addMessageToChat('bot', 'Sorry, I encountered an unexpected response.');
        }
    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator();
        addMessageToChat('bot', 'Connection error. Make sure backend is running.');
    }

    scrollChatToBottom();
}

// Add message to chat display
function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatMessages.querySelector('.welcome-message')) {
        chatMessages.querySelector('.welcome-message').remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    const avatar = sender === 'user' ? 'U' : 'A';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-bubble">${message}</div>
            <div class="message-time">${timestamp}</div>
        </div>
    `;

    chatMessages.appendChild(messageElement);
}

// Add sources reference to last message
function addSourcesToLastMessage(sources) {
    const lastMessage = document.querySelectorAll('.message.bot')[document.querySelectorAll('.message.bot').length - 1];
    if (lastMessage) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'sources';
        sourcesDiv.innerHTML = `
            <h4><i class="fas fa-bookmark"></i> Sources</h4>
            <ul>
                ${sources.map(source => `<li>${source}</li>`).join('')}
            </ul>
        `;
        lastMessage.querySelector('.message-content').appendChild(sourcesDiv);
    }
}

// Add videos reference to last message
function addVideosToLastMessage(videos) {
    const lastMessage = document.querySelectorAll('.message.bot')[document.querySelectorAll('.message.bot').length - 1];
    if (lastMessage) {
        const videosDiv = document.createElement('div');
        videosDiv.className = 'videos';
        videosDiv.innerHTML = `
            <h4><i class="fas fa-video"></i> Related Videos</h4>
            ${videos.map(video => `
                <div class="video-item">
                    <a href="${video.url}" target="_blank">
                        <i class="fas fa-play-circle"></i>
                        ${video.title}
                    </a>
                </div>
            `).join('')}
        `;
        lastMessage.querySelector('.message-content').appendChild(videosDiv);
    }
}

// Format response with markdown support
function formatResponse(response) {
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
    response = response.replace(/\n/g, '<br>');
    return response;
}

// Show loading indicator
function showLoadingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot loading-message';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `
        <div class="message-avatar">A</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollChatToBottom();
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Go back to subjects
function backToSubjects() {
    currentSubject = null;
    document.getElementById('chatView').classList.remove('active-view');
    document.getElementById('subjectView').classList.add('active-view');
    loadSubjects();
}

// Create custom subject
function createCustomSubject() {
    const customSubjectInput = document.getElementById('customSubject');
    const subject = customSubjectInput.value.trim();

    if (!subject) {
        alert('Please enter a subject name');
        return;
    }

    selectSubject(subject);
    customSubjectInput.value = '';
}

// Add loading animation CSS
const style = document.createElement('style');
style.textContent = `
    .loading-dots {
        display: flex;
        gap: 4px;
        justify-content: center;
        align-items: center;
    }

    .loading-dots span {
        width: 8px;
        height: 8px;
        background-color: currentColor;
        border-radius: 50%;
        animation: pulse 1.4s infinite ease-in-out;
    }

    .loading-dots span:nth-child(1) {
        animation-delay: -0.32s;
    }

    .loading-dots span:nth-child(2) {
        animation-delay: -0.16s;
    }

    @keyframes pulse {
        0%, 60%, 100% {
            opacity: 0.3;
        }
        30% {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Add Enter key support
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const messageInput = document.getElementById('messageInput');
        if (document.activeElement === messageInput) {
            event.preventDefault();
            sendMessage();
        }
    }
});