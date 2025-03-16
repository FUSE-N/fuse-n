document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeBtn');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Chat bot responses
    const botResponses = {
        greeting: "Hello! I'm the Bonniface virtual assistant. How can I help you today with consulting, data analysis, AI integration, or any of our other services?",
        services: "We offer several services at Bonniface:\n- Consulting & Strategy\n- Data Analysis & Visualization\n- AI & Automation\n- Research & Reports\n- System Integration\n- Financial & Business Analysis\n\nWhich service would you like to know more about?",
        consulting: "Our Consulting & Strategy service helps maximize your business potential with AI-driven insights, predictive modeling, and strategic planning. We help you stay ahead of the competition with data-backed decisions.",
        dataAnalysis: "Our Data Analysis & Visualization services convert complex data into actionable insights with cutting-edge analytics, interactive dashboards, and AI-powered reporting.",
        aiAutomation: "With our AI & Automation services, we help you streamline workflows with intelligent automation and AI solutions. This reduces manual effort, enhances efficiency, and drives productivity.",
        research: "Our Research & Reports service leverages in-depth research and AI-powered analytics for data-driven decision-making and competitive insights.",
        systemIntegration: "Our System Integration services allow you to seamlessly integrate AI and data solutions into your existing systems, ensuring smooth transitions and scalable growth.",
        financialAnalysis: "Our Financial & Business Analysis services empower your financial strategies with AI-driven business intelligence, forecasting, and investment analytics.",
        portfolio: "Our portfolio includes projects in Time Series Analysis, Neural Networks, Climate Change Analytics, Image Detection, AI Job Matching Platform, and Web3 Projects. Would you like more details about any specific project?",
        contact: "You can reach us at youremail@example.com or call +233 050 616 2151. We're based remotely and typically respond to all inquiries within 24 hours.",
        thanks: "You're welcome! If you have any more questions, feel free to ask. We're here to help you transform your ideas into digital reality.",
        fallback: "I'm not sure I understand. Could you please rephrase your question? You can ask me about our services, portfolio, or how to get in touch with us.",
        goodbye: "Thank you for chatting with us! If you need anything else, don't hesitate to reach out. Have a great day!",
        inactivity: "Just checking in – are you still there? If you have any other questions about Bonniface's services or would like to discuss a potential project, I'm here to help."
    };
    
    // Quick reply options
    const quickReplies = [
        { text: "Services", response: "services" },
        { text: "Portfolio", response: "portfolio" },
        { text: "Contact", response: "contact" }
    ];
    
    // Chat state
    let inactivityTimer;
    let lastActivity = Date.now();
    
    // Functions
    function toggleChat() {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            // Send greeting message if this is the first time opening
            if (chatBody.children.length <= 1) { // Only typing indicator present
                setTimeout(() => {
                    sendBotMessage(botResponses.greeting);
                    addQuickReplies();
                }, 1000);
            }
            resetInactivityTimer();
        } else {
            clearTimeout(inactivityTimer);
        }
    }
    
    function addQuickReplies() {
        const quickRepliesContainer = document.createElement('div');
        quickRepliesContainer.className = 'quick-replies';
        
        quickReplies.forEach(reply => {
            const button = document.createElement('div');
            button.className = 'quick-reply';
            button.textContent = reply.text;
            button.addEventListener('click', () => {
                sendUserMessage(reply.text);
                handleUserInput(reply.response);
            });
            quickRepliesContainer.appendChild(button);
        });
        
        chatBody.appendChild(quickRepliesContainer);
        scrollToBottom();
    }
    
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        lastActivity = Date.now();
        inactivityTimer = setTimeout(() => {
            if (chatWindow.classList.contains('active') && Date.now() - lastActivity >= 300000) { // 5 minutes
                sendBotMessage(botResponses.inactivity);
            }
        }, 300000); // 5 minutes
    }
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            sendUserMessage(message);
            handleUserInput(message.toLowerCase());
            chatInput.value = '';
        }
    }
    
    function sendUserMessage(message) {
        const messageElement = createMessageElement(message, 'user-message');
        chatBody.appendChild(messageElement);
        scrollToBottom();
        resetInactivityTimer();
    }
    
    function sendBotMessage(message) {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const messageElement = createMessageElement(message, 'bot-message');
            chatBody.appendChild(messageElement);
            scrollToBottom();
        }, 1000);
    }
    
    function createMessageElement(message, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${className}`;
        messageElement.textContent = message;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = getCurrentTime();
        messageElement.appendChild(timeElement);
        
        return messageElement;
    }
    
    function showTypingIndicator() {
        typingIndicator.classList.add('active');
        scrollToBottom();
    }
    
    function hideTypingIndicator() {
        typingIndicator.classList.remove('active');
    }
    
    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function handleUserInput(input) {
        // Keywords for pattern matching
        if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
            sendBotMessage(botResponses.greeting);
        } else if (input.includes('service') || input === 'services') {
            sendBotMessage(botResponses.services);
        } else if (input.includes('consult') || input.includes('strategy')) {
            sendBotMessage(botResponses.consulting);
        } else if (input.includes('data') || input.includes('analysis') || input.includes('visualization')) {
            sendBotMessage(botResponses.dataAnalysis);
        } else if (input.includes('ai') || input.includes('automation')) {
            sendBotMessage(botResponses.aiAutomation);
        } else if (input.includes('research') || input.includes('report')) {
            sendBotMessage(botResponses.research);
        } else if (input.includes('system') || input.includes('integration')) {
            sendBotMessage(botResponses.systemIntegration);
        } else if (input.includes('financial') || input.includes('business analysis')) {
            sendBotMessage(botResponses.financialAnalysis);
        } else if (input.includes('portfolio') || input.includes('project') || input === 'portfolio') {
            sendBotMessage(botResponses.portfolio);
        } else if (input.includes('contact') || input.includes('email') || input.includes('phone') || input === 'contact') {
            sendBotMessage(botResponses.contact);
        } else if (input.includes('thank')) {
            sendBotMessage(botResponses.thanks);
        } else if (input.includes('bye') || input.includes('goodbye')) {
            sendBotMessage(botResponses.goodbye);
        } else {
            // Add more sophisticated NLP here if needed
            sendBotMessage(botResponses.fallback);
        }
        
        // Reset inactivity timer after user input
        resetInactivityTimer();
    }
    
    // Event Listeners
    chatToggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Track user activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    
    // Add additional functionality for specific services or portfolio items
    function addSpecificServiceHandlers() {
        const serviceResponses = {
            'time series': 'Our Time Series Analysis project utilizes AI-driven predictive algorithms to forecast trends and identify patterns in temporal data. This helps businesses make data-driven decisions based on historical patterns.',
            'neural network': 'Our Neural Networks project implements cutting-edge deep learning architectures to solve complex problems. We've built systems that can recognize patterns, classify data, and make predictions with high accuracy.',
            'climate': 'Our Climate Change Analytics project uses advanced data science techniques to analyze environmental data, identify trends, and provide actionable insights for sustainable business practices.',
            'image detection': 'Our Image Detection project utilizes computer vision algorithms to identify and classify objects in images and video streams in real-time, with applications in security, retail, and manufacturing.',
            'job matching': 'Our AI Job Matching Platform uses machine learning to match job seekers with opportunities based on skills, experience, and preferences, improving hiring outcomes for businesses.',
            'web3': 'Our Web3 Projects focus on building decentralized applications and blockchain-powered solutions, helping businesses innovate within the emerging Web3 ecosystem.'
        };
        
        // Add handlers for portfolio items
        for (const [keyword, response] of Object.entries(serviceResponses)) {
            const handler = input => {
                if (input.toLowerCase().includes(keyword)) {
                    return response;
                }
                return null;
            };
            
            // Add to the handleUserInput function
            const originalHandler = handleUserInput;
            handleUserInput = input => {
                const specificResponse = handler(input);
                if (specificResponse) {
                    sendBotMessage(specificResponse);
                } else {
                    originalHandler(input);
                }
            };
        }
    }
    
    // Call this function to add specific handlers
    addSpecificServiceHandlers();
});