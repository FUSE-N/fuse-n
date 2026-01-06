document.addEventListener('DOMContentLoaded', function() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeBtn');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');

    const botResponses = {
        greeting: "Hello! I'm the Bonniface virtual assistant. How can I help you today with consulting, data analysis, AI integration, or any of our other services?",
        services: "We offer several services at Bonniface:\n\n• Consulting & Strategy\n• Data Analysis & Visualization\n• AI & Automation\n• Research & Reports\n• System Integration\n• Financial & Business Analysis\n\nWhich service would you like to know more about?",
        consulting: "Our Consulting & Strategy service helps maximize your business potential with AI-driven insights, predictive modeling, and strategic planning. We help you stay ahead of the competition with data-backed decisions.",
        dataAnalysis: "Our Data Analysis & Visualization services convert complex data into actionable insights with cutting-edge analytics, interactive dashboards, and AI-powered reporting.",
        aiAutomation: "With our AI & Automation services, we help you streamline workflows with intelligent automation and AI solutions. This reduces manual effort, enhances efficiency, and drives productivity.",
        research: "Our Research & Reports service leverages in-depth research and AI-powered analytics for data-driven decision-making and competitive insights.",
        systemIntegration: "Our System Integration services allow you to seamlessly integrate AI and data solutions into your existing systems, ensuring smooth transitions and scalable growth.",
        financialAnalysis: "Our Financial & Business Analysis services empower your financial strategies with AI-driven business intelligence, forecasting, and investment analytics.",
        portfolio: "Our portfolio includes projects in:\n\n• Time Series Analysis\n• Neural Networks\n• Climate Change Analytics\n• Image Detection\n• AI Job Matching Platform\n• Web3 Projects\n\nWould you like more details about any specific project?",
        contact: "You can reach us at:\n\n📧 Email: kalongboniface97@gmail.com\n📱 Phone: +233 (50) 616-2161\n🌍 Location: Remote (Worldwide)\n⚡ Response Time: Within 24 hours\n\nFeel free to get in touch anytime!",
        thanks: "You're welcome! If you have any more questions, feel free to ask. We're here to help you transform your ideas into digital reality.",
        fallback: "I'm not sure I understand. Could you please rephrase your question? You can ask me about our services, portfolio, or how to get in touch with us.",
        goodbye: "Thank you for chatting with us! If you need anything else, don't hesitate to reach out. Have a great day!",
        inactivity: "Just checking in – are you still there? If you have any other questions about Bonniface's services or would like to discuss a potential project, I'm here to help.",
        timeSeries: "Our Time Series Analysis project utilizes AI-driven predictive algorithms to forecast trends and identify patterns in temporal data. This helps businesses make data-driven decisions based on historical patterns.",
        neuralNetwork: "Our Neural Networks project implements cutting-edge deep learning architectures to solve complex problems. We've built systems that can recognize patterns, classify data, and make predictions with high accuracy.",
        climate: "Our Climate Change Analytics project uses advanced data science techniques to analyze environmental data, identify trends, and provide actionable insights for sustainable business practices.",
        imageDetection: "Our Image Detection project utilizes computer vision algorithms to identify and classify objects in images and video streams in real-time, with applications in security, retail, and manufacturing.",
        jobMatching: "Our AI Job Matching Platform uses machine learning to match job seekers with opportunities based on skills, experience, and preferences, improving hiring outcomes for businesses.",
        web3: "Our Web3 Projects focus on building decentralized applications and blockchain-powered solutions, helping businesses innovate within the emerging Web3 ecosystem.",
        pricing: "Our pricing is flexible and depends on the scope and complexity of your project. We offer competitive rates and custom packages tailored to your needs. Please contact us for a detailed quote!",
        timeline: "Project timelines vary based on complexity and requirements. Typically, small projects take 2-4 weeks, medium projects 1-2 months, and larger projects 3-6 months. We'll provide a detailed timeline after discussing your specific needs."
    };

    const quickReplies = [
        { text: "Services", response: "services" },
        { text: "Portfolio", response: "portfolio" },
        { text: "Contact", response: "contact" }
    ];

    let inactivityTimer;
    let lastActivity = Date.now();
    let isFirstOpen = true;

    function toggleChat() {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            if (isFirstOpen) {
                setTimeout(() => {
                    sendBotMessage(botResponses.greeting);
                    addQuickReplies();
                    isFirstOpen = false;
                }, 500);
            }
            resetInactivityTimer();
            chatInput.focus();
        } else {
            clearTimeout(inactivityTimer);
        }
    }

    function addQuickReplies() {
        const existingQuickReplies = chatBody.querySelector('.quick-replies');
        if (existingQuickReplies) {
            existingQuickReplies.remove();
        }

        const quickRepliesContainer = document.createElement('div');
        quickRepliesContainer.className = 'quick-replies';

        quickReplies.forEach(reply => {
            const button = document.createElement('div');
            button.className = 'quick-reply';
            button.textContent = reply.text;
            button.addEventListener('click', () => {
                quickRepliesContainer.remove();
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
            if (chatWindow.classList.contains('active') && Date.now() - lastActivity >= 300000) {
                sendBotMessage(botResponses.inactivity);
            }
        }, 300000);
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const existingQuickReplies = chatBody.querySelector('.quick-replies');
            if (existingQuickReplies) {
                existingQuickReplies.remove();
            }

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
        setTimeout(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 100);
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function handleUserInput(input) {
        let response = botResponses.fallback;

        if (input.includes('hi') || input.includes('hello') || input.includes('hey') || input.includes('greet')) {
            response = botResponses.greeting;
        } else if (input.includes('service') || input === 'services') {
            response = botResponses.services;
        } else if (input.includes('consult') || input.includes('strategy')) {
            response = botResponses.consulting;
        } else if (input.includes('data') || input.includes('analysis') || input.includes('visualization')) {
            response = botResponses.dataAnalysis;
        } else if (input.includes('ai') || input.includes('automation') || input.includes('automat')) {
            response = botResponses.aiAutomation;
        } else if (input.includes('research') || input.includes('report')) {
            response = botResponses.research;
        } else if (input.includes('system') || input.includes('integration') || input.includes('integrat')) {
            response = botResponses.systemIntegration;
        } else if (input.includes('financial') || input.includes('business') || input.includes('finance')) {
            response = botResponses.financialAnalysis;
        } else if (input.includes('portfolio') || input.includes('project') || input === 'portfolio') {
            response = botResponses.portfolio;
        } else if (input.includes('time series') || input.includes('timeseries') || input.includes('forecast')) {
            response = botResponses.timeSeries;
        } else if (input.includes('neural') || input.includes('deep learning')) {
            response = botResponses.neuralNetwork;
        } else if (input.includes('climate') || input.includes('environment')) {
            response = botResponses.climate;
        } else if (input.includes('image') || input.includes('vision') || input.includes('detection')) {
            response = botResponses.imageDetection;
        } else if (input.includes('job') || input.includes('matching') || input.includes('recruitment')) {
            response = botResponses.jobMatching;
        } else if (input.includes('web3') || input.includes('blockchain') || input.includes('crypto')) {
            response = botResponses.web3;
        } else if (input.includes('contact') || input.includes('email') || input.includes('phone') || input === 'contact') {
            response = botResponses.contact;
        } else if (input.includes('price') || input.includes('pricing') || input.includes('cost') || input.includes('rate')) {
            response = botResponses.pricing;
        } else if (input.includes('timeline') || input.includes('how long') || input.includes('duration')) {
            response = botResponses.timeline;
        } else if (input.includes('thank')) {
            response = botResponses.thanks;
        } else if (input.includes('bye') || input.includes('goodbye')) {
            response = botResponses.goodbye;
        }

        sendBotMessage(response);
        resetInactivityTimer();
    }

    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', toggleChat);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChat);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
});
