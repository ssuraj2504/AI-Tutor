const API_BASE_URL = 'http://localhost:5000/api';
let currentSubject = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    updateUserUI();
    if (!token) {
        // show auth modal if not logged in
        showAuthModal();
    } else {
        loadSubjects();
    }
});

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Load available subjects
async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`, { headers: getAuthHeaders() });
        if (response.status === 401) {
            showAuthModal();
            return;
        }
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
    
    // try to load user history for this subject, otherwise show welcome message
    loadHistoryForSubject(subject);

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
            headers: getAuthHeaders(),
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

/* --------------------
   Auth modal and actions
   -------------------- */
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    showLogin();
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.getElementById('authMsg').textContent = '';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Register';
    document.getElementById('authMsg').textContent = '';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Login';
    document.getElementById('authMsg').textContent = '';
}

async function doLogin() {
    const user = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value;
    const msgEl = document.getElementById('authMsg');
    msgEl.textContent = '';
    if (!user || !pass) {
        msgEl.textContent = 'Please fill username and password';
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (!res.ok) {
            msgEl.textContent = data.error || 'Login failed';
            return;
        }
        localStorage.setItem('auth_token', data.token);
        if (data.user) {
            localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
            localStorage.setItem('auth_user', JSON.stringify({ username: user }));
        }
        hideAuthModal();
        updateUserUI();
        loadSubjects();
    } catch (err) {
        console.error('Login error', err);
        msgEl.textContent = 'Login error. Check console.';
    }
}

async function doRegister() {
    const user = document.getElementById('regUsername').value.trim();
    const pass = document.getElementById('regPassword').value;
    const msgEl = document.getElementById('authMsg');
    msgEl.textContent = '';
    if (!user || !pass) {
        msgEl.textContent = 'Please fill username and password';
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (!res.ok) {
            msgEl.textContent = data.error || 'Registration failed';
            return;
        }
        // auto login after successful registration
        await doLoginAfterRegister(user, pass);
    } catch (err) {
        console.error('Register error', err);
        msgEl.textContent = 'Registration error. Check console.';
    }
}

async function doLoginAfterRegister(user, pass) {
    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (!res.ok) {
            document.getElementById('authMsg').textContent = data.error || 'Auto login failed';
            return;
        }
        localStorage.setItem('auth_token', data.token);
        if (data.user) {
            localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
            localStorage.setItem('auth_user', JSON.stringify({ username: user }));
        }
        hideAuthModal();
        updateUserUI();
        loadSubjects();
    } catch (err) {
        console.error('Auto login error', err);
        document.getElementById('authMsg').textContent = 'Auto login failed';
    }
}

function logout() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    updateUserUI();
    // clear chat and show auth modal
    document.getElementById('chatMessages').innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-sparkles"></i>
            <h3>Welcome to Your Learning Session</h3>
            <p>Ask questions about the selected topic. I'll provide detailed answers with sources and resources.</p>
        </div>
    `;
    showAuthModal();
}

// Update header UI to show logged-in user and a logout button
function updateUserUI() {
    const userDisplay = document.getElementById('userDisplay');
    const loginBtn = document.getElementById('loginBtn');
    const raw = localStorage.getItem('auth_user');
    let user = null;
    if (raw) {
        try {
            user = JSON.parse(raw);
        } catch (e) {
            user = { username: raw };
        }
    }

    if (user && localStorage.getItem('auth_token')) {
        userDisplay.style.display = 'flex';
        document.getElementById('displayName').textContent = user.display_name || user.username || '';
        if (loginBtn) loginBtn.style.display = 'none';

        // add logout button if not present
        if (!document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'btn btn--outline';
            logoutBtn.style.marginLeft = '8px';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = logout;
            userDisplay.parentNode.appendChild(logoutBtn);
        }
        // add history button if not present
        if (!document.getElementById('historyBtn')) {
            const histBtn = document.createElement('button');
            histBtn.id = 'historyBtn';
            histBtn.className = 'btn btn--primary';
            histBtn.style.marginLeft = '8px';
            histBtn.textContent = 'History';
            histBtn.onclick = showHistoryModal;
            userDisplay.parentNode.appendChild(histBtn);
        }
    } else {
        userDisplay.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        const lb = document.getElementById('logoutBtn');
        if (lb) lb.remove();
        const hb = document.getElementById('historyBtn');
        if (hb) hb.remove();
    }
}

// Show / hide history modal
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    modal.style.display = 'flex';
    loadAllHistory();
}

function hideHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    modal.style.display = 'none';
}

// Load all history and render in modal
async function loadAllHistory() {
    const content = document.getElementById('historyContent');
    if (!content) return;
    content.innerHTML = '<p style="color:var(--color-text-secondary)">Loading...</p>';
    try {
        const res = await fetch(`${API_BASE_URL}/history`, { headers: getAuthHeaders() });
        if (!res.ok) {
            content.innerHTML = `<p style="color:var(--color-error)">Could not load history. Please login.</p>`;
            return;
        }
        const data = await res.json();
        const history = data.history || [];
        if (!history.length) {
            content.innerHTML = `<p style="color:var(--color-text-secondary)">No history yet. Ask a question to get started.</p>`;
            return;
        }

        // render entries grouped by subject (newest first)
        const list = document.createElement('div');
        list.className = 'history-list';
        // show newest first
        history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.padding = '10px';
            item.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
            const subj = entry.subject || 'General';
            const time = entry.created_at ? new Date(entry.created_at).toLocaleString() : '';
            const q = entry.question || '';
            const a = (entry.answer || '').replace(/\n/g, '<br>');

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div style="font-weight:600">${subj}</div>
                    <div style="color:var(--color-text-secondary); font-size:12px">${time}</div>
                </div>
                <div style="margin-top:6px; color:var(--color-text);">Q: ${escapeHtml(q)}</div>
                <div style="margin-top:6px; color:var(--color-text-secondary);">A: ${a}</div>
                <div style="margin-top:8px; display:flex; gap:8px;">
                    <button class="btn btn--outline" onclick="(function(){ hideHistoryModal(); selectSubject('${escapeJs(subj)}'); })()">Open Subject</button>
                </div>
            `;
            list.appendChild(item);
        });

        // replace content
        content.innerHTML = '';
        content.appendChild(list);
    } catch (err) {
        console.error('History load error', err);
        content.innerHTML = `<p style="color:var(--color-error)">Error loading history.</p>`;
    }
}

// small helper to escape HTML in questions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"']/g, function(m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[m];
    });
}

// escape JS string for inline onclick usage
function escapeJs(s) {
    if (!s) return '';
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Load and render history for the selected subject
async function loadHistoryForSubject(subject) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    try {
        const res = await fetch(`${API_BASE_URL}/history`, { headers: getAuthHeaders() });
        if (!res.ok) {
            // show welcome if unauthorized or error
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-sparkles"></i>
                    <h3>Welcome to ${subject}</h3>
                    <p>Ask anything about this subject. I'll provide detailed answers with sources.</p>
                </div>
            `;
            return;
        }
        const data = await res.json();
        const history = (data.history || []).filter(h => (h.subject || '') === subject);

        if (!history || history.length === 0) {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-sparkles"></i>
                    <h3>Welcome to ${subject}</h3>
                    <p>Ask anything about this subject. I'll provide detailed answers with sources.</p>
                </div>
            `;
            return;
        }

        // history comes newest-first; display oldest-first
        history.reverse();
        for (const entry of history) {
            addMessageToChat('user', entry.question);
            // small subject tag could be added to bot message
            const answerHtml = entry.answer || '';
            addMessageToChat('bot', formatResponse(answerHtml));
            if (entry.sources && entry.sources.length > 0) {
                addSourcesToLastMessage(entry.sources);
            }
            if (entry.videos && entry.videos.length > 0) {
                addVideosToLastMessage(entry.videos);
            }
        }
    } catch (err) {
        console.error('Could not load history', err);
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-sparkles"></i>
                <h3>Welcome to ${subject}</h3>
                <p>Ask anything about this subject. I'll provide detailed answers with sources.</p>
            </div>
        `;
    }
}