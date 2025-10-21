// mannieTechAI-chat.js
// Site Loader functionality
function initSiteLoader() {
    const siteLoader = document.getElementById('siteLoader');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!siteLoader) return;
    
    let progress = 0;
    const targetProgress = 100;
    const duration = 2500; // 2.5 seconds total
    const interval = 50; // Update every 50ms
    const steps = duration / interval;
    const increment = targetProgress / steps;
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
        progress += increment;
        
        if (progress >= targetProgress) {
            progress = targetProgress;
            clearInterval(progressInterval);
            
            // Complete loading
            setTimeout(() => {
                siteLoader.classList.add('fade-out');
                setTimeout(() => {
                    siteLoader.style.display = 'none';
                }, 800);
            }, 500);
        }
        
        // Update progress bar and text
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
        
    }, interval);
}

// Update your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    // Initialize site loader first
    initSiteLoader();
    
    // Then initialize your main application after a brief delay
    setTimeout(() => {
        // Your existing initialization code here...
        const navToggle = document.getElementById('navToggle');
        const sideNav = document.getElementById('sideNav');
        // ... rest of your existing initialization code
        
        // Initialize the application
        init();
    }, 500);
});

// Also handle page refresh/show
window.addEventListener('beforeunload', function() {
    // Show loader again when page is about to refresh
    const siteLoader = document.getElementById('siteLoader');
    if (siteLoader) {
        siteLoader.style.display = 'flex';
        siteLoader.classList.remove('fade-out');
    }
});

// Handle page load from cache (back/forward navigation)
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from cache, show loader briefly
        const siteLoader = document.getElementById('siteLoader');
        if (siteLoader) {
            siteLoader.style.display = 'flex';
            siteLoader.classList.remove('fade-out');
            setTimeout(() => {
                siteLoader.classList.add('fade-out');
                setTimeout(() => {
                    siteLoader.style.display = 'none';
                }, 800);
            }, 1000);
        }
    }
});

//////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function () {
    // Navigation toggle functionality
    const navToggle = document.getElementById('navToggle');
    const sideNav = document.getElementById('sideNav');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const oldChats = document.getElementById('oldChats');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalDelete = document.getElementById('modalDelete');

    // Clear All Modal elements
    const clearAllModalOverlay = document.getElementById('clearAllModalOverlay');
    const clearAllModalClose = document.getElementById('clearAllModalClose');
    const clearAllModalCancel = document.getElementById('clearAllModalCancel');
    const clearAllModalConfirm = document.getElementById('clearAllModalConfirm');

    // Send message functionality
    const sendBtn = document.querySelector('.sendBtn');
    const typingInput = document.querySelector('.typing-input');
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');

    // OpenRouter API Configuration
    const OPENROUTER_API_KEY = CONFIG.OPENROUTER_API_KEY;
    const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    const MODEL_NAME = 'mistralai/mistral-7b-instruct';

    // Chat history management
    let chatHistory = JSON.parse(localStorage.getItem('mannietech_chat_history')) || [];
    let currentChatId = null;
    let chatToDelete = null;
    let isProcessing = false;

    // Sound functionality
    let sendSound = null;

    // Initialize the application
    function init() {
        initSound();
        initChatHistory();
        initMobileBehaviors();
        setupEventListeners();
    }

    // Add this new function for mobile behaviors
    function initMobileBehaviors() {
        const sideNav = document.getElementById('sideNav');
        const navToggle = document.getElementById('navToggle');
        
        // Close nav when a chat is selected on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                // Close nav when clicking on chat items
                if (e.target.closest('.chat-item-content')) {
                    sideNav.classList.remove('nav-open');
                }
                
                // Close nav when starting a new chat
                if (e.target.closest('.newChatBtn')) {
                    setTimeout(() => {
                        sideNav.classList.remove('nav-open');
                    }, 300);
                }
            }
        });
        
        // Prevent body scroll when nav is open on mobile
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    if (sideNav.classList.contains('nav-open')) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(sideNav, { attributes: true });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', function() {
            // Close nav on orientation change
            sideNav.classList.remove('nav-open');
            
            // Small delay to ensure CSS is applied
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        });
        
        // Handle resize events
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                // Close nav on resize to mobile
                if (window.innerWidth > 768) {
                    sideNav.classList.remove('nav-open');
                    document.body.style.overflow = '';
                }
            }, 250);
        });
    }

    // Initialize sound
    function initSound() {
        try {
            sendSound = new Audio('soundAI.wav');
            sendSound.volume = 0.3; // Set volume to 30%
            sendSound.preload = 'auto';
        } catch (error) {
            console.log('Sound initialization failed:', error);
        }
    }

    // Play send sound
    function playSendSound() {
        if (sendSound) {
            sendSound.currentTime = 0; // Reset to start
            sendSound.play().catch(error => {
                console.log('Sound play failed:', error);
            });
        }
    }

    // Initialize chat history
    function initChatHistory() {
        renderChatHistory();
        // Load the latest chat if exists
        if (chatHistory.length > 0) {
            loadChat(chatHistory[0].id);
        }
    }

    // Render chat history
    function renderChatHistory() {
        oldChats.innerHTML = '';
        
        if (chatHistory.length === 0) {
            oldChats.innerHTML = '<div class="empty-chats">No recent chats</div>';
            return;
        }

        chatHistory.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.setAttribute('data-chat-id', chat.id);
            
            chatItem.innerHTML = `
                <div class="chat-item-content" title="${chat.title}">
                    ${chat.title}
                </div>
                <button class="chat-item-delete" data-chat-id="${chat.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
                    </svg>
                </button>
            `;

            // Chat item click
            chatItem.querySelector('.chat-item-content').addEventListener('click', () => {
                loadChat(chat.id);
                if (window.innerWidth <= 900) {
                    sideNav.classList.remove('nav-open');
                }
            });

            // Delete button click
            chatItem.querySelector('.chat-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteModal(chat.id, chat.title);
            });

            oldChats.appendChild(chatItem);
        });
    }

    // Create new chat
    function createNewChat() {
        currentChatId = 'chat_' + Date.now();
        const newChat = {
            id: currentChatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        chatHistory.unshift(newChat);
        saveChatHistory();
        renderChatHistory();
        
        // Clear messages and show welcome screen
        clearMessages();
        welcomeScreen.style.display = 'flex';
        
        // Close mobile nav if open
        if (window.innerWidth <= 900) {
            sideNav.classList.remove('nav-open');
        }

        console.log('New chat created:', currentChatId);
    }

    // Save message to current chat
    function saveMessageToChat(role, content) {
        if (!currentChatId) {
            createNewChat();
        }
        
        const chatIndex = chatHistory.findIndex(c => c.id === currentChatId);
        if (chatIndex !== -1) {
            const chat = chatHistory[chatIndex];
            chat.messages.push({ 
                role, 
                content, 
                timestamp: new Date().toISOString() 
            });
            
            // Update chat title with first user message
            if (role === 'user' && chat.title === 'New Chat') {
                chat.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
            }
            
            // Update last activity and move to top
            chat.lastActivity = new Date().toISOString();
            chatHistory.splice(chatIndex, 1);
            chatHistory.unshift(chat);
            
            saveChatHistory();
            renderChatHistory();
        }
    }

    // Load chat
    function loadChat(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (chat) {
            currentChatId = chatId;
            clearMessages();
            
            if (chat.messages.length === 0) {
                welcomeScreen.style.display = 'flex';
            } else {
                welcomeScreen.style.display = 'none';
                // Render all messages from the chat
                chat.messages.forEach(msg => {
                    renderMessage(msg.role, msg.content, false);
                });
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            console.log('Chat loaded:', chatId);
        }
    }

    // Render message to UI
    function renderMessage(role, content, animate = true) {
        const message = document.createElement('div');
        message.classList.add('message', `${role}-message`);
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.innerHTML = `
            <span>${role === 'user' ? 'You' : 'MannieTech AI'}</span>
            <span>${getCurrentTime()}</span>
        `;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        message.appendChild(messageHeader);
        message.appendChild(messageContent);
        
        if (animate) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(10px)';
        }
        
        messagesContainer.appendChild(message);
        
        if (animate) {
            setTimeout(() => {
                message.style.transition = 'all 0.3s ease';
                message.style.opacity = '1';
                message.style.transform = 'translateY(0)';
            }, 10);
        }
        
        return message;
    }

    // Clear all messages from UI
    function clearMessages() {
        const messages = messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        welcomeScreen.style.display = 'flex';
    }

    // Save chat history to localStorage
    function saveChatHistory() {
        // Keep only last 20 chats and sort by last activity
        chatHistory = chatHistory
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
            .slice(0, 20);
        
        localStorage.setItem('mannietech_chat_history', JSON.stringify(chatHistory));
    }

    // Delete chat
    function deleteChat(chatId) {
        chatHistory = chatHistory.filter(chat => chat.id !== chatId);
        
        // If deleted chat was current, switch to latest or create new
        if (currentChatId === chatId) {
            if (chatHistory.length > 0) {
                loadChat(chatHistory[0].id);
            } else {
                currentChatId = null;
                clearMessages();
            }
        }
        
        saveChatHistory();
        renderChatHistory();
        hideDeleteModal();
        
        console.log('Chat deleted:', chatId);
    }

    // Clear all chats
    function clearAllChats() {
        chatHistory = [];
        currentChatId = null;
        saveChatHistory();
        renderChatHistory();
        clearMessages();
        hideClearAllModal();
        console.log('All chats cleared');
        
        // Show a brief confirmation
        const originalText = clearAllBtn.textContent;
        clearAllBtn.textContent = 'Cleared!';
        clearAllBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        
        setTimeout(() => {
            clearAllBtn.textContent = originalText;
            clearAllBtn.style.background = 'transparent';
        }, 2000);
    }

    // Modal functions for delete chat
    function showDeleteModal(chatId, chatTitle) {
        chatToDelete = chatId;
        modalOverlay.classList.add('active');
    }

    function hideDeleteModal() {
        modalOverlay.classList.remove('active');
        chatToDelete = null;
    }

    // Modal functions for clear all
    function showClearAllModal() {
        if (chatHistory.length === 0) {
            alert('No chats to clear.');
            return;
        }
        clearAllModalOverlay.classList.add('active');
    }

    function hideClearAllModal() {
        clearAllModalOverlay.classList.remove('active');
    }

    // Setup event listeners
    function setupEventListeners() {
        newChatBtn.addEventListener('click', createNewChat);
        clearAllBtn.addEventListener('click', showClearAllModal);

        // Delete chat modal
        modalClose.addEventListener('click', hideDeleteModal);
        modalCancel.addEventListener('click', hideDeleteModal);
        modalDelete.addEventListener('click', () => {
            if (chatToDelete) {
                deleteChat(chatToDelete);
            }
        });

        // Clear all modal
        clearAllModalClose.addEventListener('click', hideClearAllModal);
        clearAllModalCancel.addEventListener('click', hideClearAllModal);
        clearAllModalConfirm.addEventListener('click', clearAllChats);

        // Close modals when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideDeleteModal();
            }
        });

        clearAllModalOverlay.addEventListener('click', (e) => {
            if (e.target === clearAllModalOverlay) {
                hideClearAllModal();
            }
        });

        // Enhanced nav toggle for mobile
        navToggle.addEventListener('click', function() {
            sideNav.classList.toggle('nav-open');
            
            // On mobile, focus management
            if (window.innerWidth <= 768 && sideNav.classList.contains('nav-open')) {
                // Set focus to first element in nav for better accessibility
                const firstNavElement = sideNav.querySelector('.newChatBtn');
                if (firstNavElement) {
                    firstNavElement.focus();
                }
            }
        });

        // Enhanced auto-resize input field for mobile
        typingInput.addEventListener('input', function() {
            this.style.height = 'auto';
            const newHeight = Math.min(this.scrollHeight, 120); // Reduced max height for mobile
            this.style.height = newHeight + 'px';
            
            // Adjust messages container padding to avoid overlap with keyboard
            if (window.innerWidth <= 768) {
                messagesContainer.style.paddingBottom = (newHeight + 20) + 'px';
            }
        });

        // Reset messages container padding when input is cleared
        typingInput.addEventListener('blur', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    messagesContainer.style.paddingBottom = '15px';
                }, 300);
            }
        });

        // Send message events with sound
        sendBtn.addEventListener('click', function() {
            playSendSound();
            sendMessageEnhanced();
        });

        typingInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                playSendSound();
                sendMessageEnhanced();
            }
        });

        // Close nav when clicking outside on mobile
        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 900 &&
                !sideNav.contains(e.target) &&
                !navToggle.contains(e.target) &&
                sideNav.classList.contains('nav-open')) {
                sideNav.classList.remove('nav-open');
            }
        });
    }

    // Function to stream AI response with clear typing
    async function streamAIResponseWithClearTyping(userMessage, messageContent) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'MannieTech AI Chat'
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are MannieTech AI, a helpful AI assistant specialized in web development, coding, design, and technology. Provide clear, concise, and helpful responses. Keep responses focused on web development topics when possible.'
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const fullResponse = data.choices[0]?.message?.content || '';

            if (!fullResponse) {
                throw new Error('No response from AI');
            }

            // Clear thinking indicator
            messageContent.innerHTML = '';
            
            // Type out the response character by character with clear visibility
            let displayedText = '';
            
            for (let i = 0; i < fullResponse.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 20));
                displayedText += fullResponse[i];
                messageContent.innerHTML = displayedText + '<span class="typewriter-cursor">|</span>';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            // Remove cursor when done
            messageContent.innerHTML = displayedText;
            
            return fullResponse;

        } catch (error) {
            console.error('Error from OpenRouter:', error);
            const errorMessage = `I apologize, but I'm having trouble connecting right now. Error: ${error.message}. Please reach out to Manasseh or try again.`;
            messageContent.innerHTML = errorMessage;
            return errorMessage;
        }
    }

    // Enhanced send message function
    async function sendMessageEnhanced() {
        if (isProcessing) return;
        
        const messageText = typingInput.value.trim();
        if (!messageText) return;

        isProcessing = true;
        setLoadingState(true);

        try {
            // Hide welcome screen if it's the first message
            if (welcomeScreen.style.display !== 'none') {
                welcomeScreen.style.display = 'none';
            }

            // Create user message UI
            const userMessageElement = renderMessage('user', messageText);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Save user message to chat history
            saveMessageToChat('user', messageText);
            
            // Reset input
            typingInput.value = '';
            typingInput.style.height = '60px';

            // Create bot message UI
            const botMessageElement = document.createElement('div');
            botMessageElement.classList.add('message', 'bot-message');
            
            const messageHeader = document.createElement('div');
            messageHeader.className = 'message-header';
            messageHeader.innerHTML = `
                <span>MannieTech AI</span>
                <span>${getCurrentTime()}</span>
            `;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.style.minHeight = '20px';
            
            botMessageElement.appendChild(messageHeader);
            botMessageElement.appendChild(messageContent);
            messagesContainer.appendChild(botMessageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Show thinking indicator
            messageContent.innerHTML = '<span class="typing-indicator">MannieTech AI is thinking<span class="typing-dots">...</span></span>';

            // Get AI response with typing effect
            const aiResponse = await streamAIResponseWithClearTyping(messageText, messageContent);
            
            // Save AI response to chat history
            saveMessageToChat('assistant', aiResponse);

        } catch (error) {
            console.error('Error in sendMessageEnhanced:', error);
            const errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again.`;
            const errorElement = document.querySelector('.bot-message:last-child .message-content');
            if (errorElement) {
                errorElement.innerHTML = errorMessage;
            }
        } finally {
            isProcessing = false;
            setLoadingState(false);
        }
    }

    // Set loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.6';
            typingInput.disabled = true;
            typingInput.placeholder = 'MannieTech AI is thinking...';
        } else {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            typingInput.disabled = false;
            typingInput.placeholder = 'Ask me anything about web development...';
        }
    }

    // Helper function to get current time
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Initialize the application
    init();
});