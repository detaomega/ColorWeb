// DOM Elements
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');
const homeView = document.getElementById('homeView');
const createView = document.getElementById('createView');
const joinView = document.getElementById('joinView');
const roomView = document.getElementById('roomView');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomInput = document.getElementById('joinRoomInput');
const roomIdInput = document.getElementById('roomIdInput');
const enterRoomBtn = document.getElementById('enterRoomBtn');
const createNewRoomBtn = document.getElementById('createNewRoomBtn');
const roomNameInput = document.getElementById('roomNameInput');
const roomTitle = document.getElementById('roomTitle');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const shareRoomBtn = document.getElementById('shareRoomBtn');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const modalRoomId = document.getElementById('modalRoomId');
const qrCodeElement = document.getElementById('qrCode');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const myRoomsSection = document.getElementById('myRoomsSection');
const myRoomsContainer = document.getElementById('myRoomsContainer');
const loadingModal = document.getElementById('loadingModal');
const loadingMessage = document.getElementById('loadingMessage');
const playAgainBtn = document.getElementById('playAgainBtn');
const questionsContainer = document.getElementById('questionsContainer');
const resultsContainer = document.getElementById('resultsContainer');
const scoreCount = document.getElementById('scoreCount');
const totalQuestions = document.getElementById('totalQuestions');
const playerInfo = document.getElementById('playerInfo');
const playerName = document.getElementById('playerName');
const playersContainer = document.getElementById('playersContainer');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const extractCanvas = document.getElementById('extractCanvas');
const questionsList = document.getElementById('questionsList');
const pendingCharacterContainer = document.getElementById('pendingCharacterContainer');
const pendingCharacterImg = document.getElementById('pendingCharacterImg');
const pendingCharacterName = document.getElementById('pendingCharacterName');
const pendingCharacterColors = document.getElementById('pendingCharacterColors');
const confirmAddCharacterBtn = document.getElementById('confirmAddCharacterBtn');

// App state
let currentView = 'home';
let uploadedCharacters = [];
let currentRoomId = null;
let currentUserId = null;
let currentUserName = 'Guest';
let currentRoom = null;
let userRooms = [];
let score = 0;

// Generate a random ID
function generateId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Initialize the app
function init() {
    // Set up event listeners for tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.tab);
        });
    });
    
    // Button event listeners
    createRoomBtn.addEventListener('click', () => setActiveTab('create'));
    joinRoomBtn.addEventListener('click', handleJoinRoom);
    enterRoomBtn.addEventListener('click', handleEnterRoom);
    createNewRoomBtn.addEventListener('click', handleCreateRoom);
    shareRoomBtn.addEventListener('click', handleShareRoom);
    closeShareModal.addEventListener('click', () => shareModal.style.display = 'none');
    copyLinkBtn.addEventListener('click', handleCopyLink);
    playAgainBtn.addEventListener('click', resetGame);
    
    // File input event listener
    fileInput.addEventListener('change', handleFileUpload);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    });
    
    // Generate user ID if not exists
    initUser();
    
    // Load user rooms
    loadUserRooms();
}

// Initialize user
function initUser() {
    // Check if user ID exists in localStorage
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + generateId(10);
        localStorage.setItem('userId', userId);
    }
    currentUserId = userId;
    
    // Get username if exists
    let userName = localStorage.getItem('userName');
    if (userName) {
        currentUserName = userName;
    } else {
        // Ask for username
        const name = prompt('Enter your name for the game:', 'Guest');
        if (name && name.trim() !== '') {
            currentUserName = name.trim();
            localStorage.setItem('userName', currentUserName);
        }
    }
    
    playerName.textContent = currentUserName;
}

// Set active tab
function setActiveTab(tabName) {
    // Update tabs
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update views
    views.forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(tabName + 'View').classList.add('active');
    currentView = tabName;
}

// Handle file upload
function handleFileUpload(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        // Process the first file for preview
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    // Extract dominant colors
                    const colors = extractDominantColors(img);
                    
                    // Show the pending character container
                    pendingCharacterContainer.style.display = 'block';
                    
                    // Update the preview image
                    pendingCharacterImg.src = event.target.result;
                    
                    // Pre-fill the character name with the filename
                    pendingCharacterName.value = file.name.split('.')[0];
                    
                    // Pre-fill the colors
                    pendingCharacterColors.value = colors.join(',');
                    
                    // Store the current image data for later use
                    pendingCharacterImg.dataset.imageData = event.target.result;
                };
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Reset the file input so the same file can be selected again
    fileInput.value = '';
}

// Add the confirmAddCharacter function
function confirmAddCharacter() {
    const name = pendingCharacterName.value.trim();
    if (!name) {
        alert('Please enter a character name');
        return;
    }
    
    // Parse the colors
    let colors = [];
    try {
        colors = pendingCharacterColors.value.split(',').map(color => color.trim());
        // Validate that colors are in hex format
        colors.forEach(color => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                throw new Error('Invalid color format');
            }
        });
    } catch (error) {
        alert('Please enter valid hex colors separated by commas (e.g., #ff0000,#00ff00)');
        return;
    }
    
    // Create character object
    const character = {
        name: name,
        colors: colors,
        image: pendingCharacterImg.dataset.imageData
    };
    
    // Add to uploadedCharacters array
    uploadedCharacters.push(character);
    
    // Create preview item
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    previewItem.innerHTML = `
        <img src="${character.image}" class="preview-img" alt="${character.name}">
        <div>Character: ${character.name}</div>
        <div class="extracted-colors">
            ${colors.map(color => `<div class="extracted-color" style="background-color: ${color};"></div>`).join('')}
        </div>
    `;
    
    previewContainer.appendChild(previewItem);
    
    // Update questions list
    updateQuestionsList();
    
    // Reset the pending character container
    pendingCharacterContainer.style.display = 'none';
    pendingCharacterName.value = '';
    pendingCharacterColors.value = '';
}

// Add event listener for confirm button
confirmAddCharacterBtn.addEventListener('click', confirmAddCharacter);

// Extract dominant colors from an image
function extractDominantColors(img) {
    const ctx = extractCanvas.getContext('2d');
    
    // Resize canvas to image dimensions (or keep it smaller for performance)
    extractCanvas.width = 100;  // Using smaller size for performance
    extractCanvas.height = 100;
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0, extractCanvas.width, extractCanvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, extractCanvas.width, extractCanvas.height);
    const pixels = imageData.data;
    
    // Count colors (using a simple approach)
    const colorCount = {};
    
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];
        
        // Skip transparent pixels
        if (pixels[i+3] < 128) continue;
        
        // Quantize colors to reduce variations
        const quantizedR = Math.round(r/20) * 20;
        const quantizedG = Math.round(g/20) * 20;
        const quantizedB = Math.round(b/20) * 20;
        
        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        
        if (!colorCount[colorKey]) {
            colorCount[colorKey] = 0;
        }
        colorCount[colorKey]++;
    }
    
    // Convert to array and sort by frequency
    const colorEntries = Object.entries(colorCount)
        .map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number);
            return {
                color: `rgb(${r}, ${g}, ${b})`,
                hexColor: rgbToHex(r, g, b),
                count
            };
        })
        .sort((a, b) => b.count - a.count);
    
    // Return top 4 colors (or fewer if there aren't enough)
    return colorEntries.slice(0, 4).map(entry => entry.hexColor);
}

// RGB to Hex conversion
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Update questions list in create view
function updateQuestionsList() {
    questionsList.innerHTML = '';
    
    uploadedCharacters.forEach((character, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-container';
        questionElement.style.padding = '15px';
        questionElement.style.marginBottom = '15px';
        questionElement.style.backgroundColor = '#f7f9fc';
        questionElement.style.borderRadius = '8px';
        
        const questionHTML = `
            <div class="question-title">Question ${index + 1}: ${character.name}</div>
            <div class="color-palette">
                ${character.colors.map(color => `<div class="color-box" style="background-color: ${color};"></div>`).join('')}
            </div>
            <div style="margin-top: 10px;">
                <input type="text" class="edit-name-input" value="${character.name}" data-index="${index}" style="margin-right: 10px;">
                <button class="save-edit-btn" data-index="${index}">Save Name</button>
            </div>
            <div style="margin-top: 10px;">
                <input type="text" class="edit-colors-input" value="${character.colors.join(',')}" data-index="${index}" style="margin-right: 10px; width: 60%;">
                <button class="save-colors-btn" data-index="${index}">Save Colors</button>
            </div>
            <div style="margin-top: 10px;">
                <button class="delete-btn" data-index="${index}">Remove</button>
            </div>
        `;
        
        questionElement.innerHTML = questionHTML;
        questionsList.appendChild(questionElement);
        
        // Add event listener to delete button
        const deleteBtn = questionElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            // Remove this character from the array
            uploadedCharacters.splice(index, 1);
            // Update the display
            updateQuestionsList();
        });
        
        // Add event listener to save name button
        const saveEditBtn = questionElement.querySelector('.save-edit-btn');
        saveEditBtn.addEventListener('click', () => {
            const newName = questionElement.querySelector('.edit-name-input').value.trim();
            if (newName) {
                uploadedCharacters[index].name = newName;
                updateQuestionsList();
            }
        });
        
        // Add event listener to save colors button
        const saveColorsBtn = questionElement.querySelector('.save-colors-btn');
        saveColorsBtn.addEventListener('click', () => {
            const colorsInput = questionElement.querySelector('.edit-colors-input').value.trim();
            try {
                const newColors = colorsInput.split(',').map(color => color.trim());
                // Validate that colors are in hex format
                newColors.forEach(color => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                        throw new Error('Invalid color format');
                    }
                });
                // Update the colors
                uploadedCharacters[index].colors = newColors;
                updateQuestionsList();
            } catch (error) {
                alert('Please enter valid hex colors separated by commas (e.g., #ff0000,#00ff00)');
            }
        });
    });
}

// Handle create room
function handleCreateRoom() {
    if (uploadedCharacters.length < 3) {
        alert('Please upload at least 3 character images to create a room.');
        return;
    }
    
    const roomName = roomNameInput.value.trim() || 'Character Guessing Room';
    
    // Show loading
    loadingModal.style.display = 'block';
    loadingMessage.textContent = 'Creating your room...';
    
    // Generate room ID
    const roomId = generateId();
    
    // Create room object
    const room = {
        id: roomId,
        name: roomName,
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
        characters: uploadedCharacters,
        players: [{
            id: currentUserId,
            name: currentUserName,
            score: 0
        }]
    };
    
    // Save room in localStorage
    saveRoom(room);
    
    // Add to user's rooms
    addRoomToUser(roomId);
    
    // Hide loading after a short delay
    setTimeout(() => {
        loadingModal.style.display = 'none';
        
        // Navigate to room
        navigateToRoom(roomId);
    }, 1000);
}

// Save room to localStorage
function saveRoom(room) {
    // Get existing rooms
    let rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    
    // Add new room
    rooms[room.id] = room;
    
    // Save back to localStorage
    localStorage.setItem('rooms', JSON.stringify(rooms));
}

// Add room to user's rooms
function addRoomToUser(roomId) {
    // Get user rooms
    userRooms = JSON.parse(localStorage.getItem('userRooms_' + currentUserId)) || [];
    
    // Add new room if not exists
    if (!userRooms.includes(roomId)) {
        userRooms.push(roomId);
    }
    
    // Save back to localStorage
    localStorage.setItem('userRooms_' + currentUserId, JSON.stringify(userRooms));
    
    // Update UI
    loadUserRooms();
}

// Load user rooms
function loadUserRooms() {
    // Get user rooms
    userRooms = JSON.parse(localStorage.getItem('userRooms_' + currentUserId)) || [];
    
    // If has rooms, show section
    if (userRooms.length > 0) {
        myRoomsSection.classList.remove('hidden');
        
        // Get all rooms
        const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
        
        // Clear container
        myRoomsContainer.innerHTML = '';
        
        // Add room items
        userRooms.forEach(roomId => {
            const room = rooms[roomId];
            if (room) {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                
                roomElement.innerHTML = `
                    <div class="room-info">
                        <div class="room-title">${room.name}</div>
                        <div class="room-id">ID: ${room.id} | ${room.characters.length} characters</div>
                    </div>
                    <div class="room-actions">
                        <button class="enter-room-btn" data-id="${room.id}">Enter</button>
                        <button class="delete-room-btn" data-id="${room.id}">Delete</button>
                    </div>
                `;
                
                myRoomsContainer.appendChild(roomElement);
                
                // Add event listeners
                const enterBtn = roomElement.querySelector('.enter-room-btn');
                const deleteBtn = roomElement.querySelector('.delete-room-btn');
                
                enterBtn.addEventListener('click', () => navigateToRoom(room.id));
                deleteBtn.addEventListener('click', () => deleteRoom(room.id));
            }
        });
    } else {
        myRoomsSection.classList.add('hidden');
    }
}

// Delete room
function deleteRoom(roomId) {
    if (confirm('Are you sure you want to delete this room?')) {
        // Get all rooms
        let rooms = JSON.parse(localStorage.getItem('rooms')) || {};
        
        // Delete room
        delete rooms[roomId];
        
        // Save back to localStorage
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Remove from user rooms
        userRooms = userRooms.filter(id => id !== roomId);
        localStorage.setItem('userRooms_' + currentUserId, JSON.stringify(userRooms));
        
        // Update UI
        loadUserRooms();
    }
}

// Handle join room
function handleJoinRoom() {
    const roomId = joinRoomInput.value.trim().toUpperCase();
    if (roomId) {
        joinRoom(roomId);
    }
}

// Handle enter room
function handleEnterRoom() {
    const roomId = roomIdInput.value.trim().toUpperCase();
    if (roomId) {
        joinRoom(roomId);
    }
}

// Join a room
function joinRoom(roomId) {
    // Get all rooms
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    
    // Check if room exists
    if (rooms[roomId]) {
        // Add user to room if not already there
        const room = rooms[roomId];
        
        if (!room.players.some(player => player.id === currentUserId)) {
            room.players.push({
                id: currentUserId,
                name: currentUserName,
                score: 0
            });
            
            // Save room
            saveRoom(room);
        }
        
        // Add to user's rooms
        addRoomToUser(roomId);
        
        // Navigate to room
        navigateToRoom(roomId);
    } else {
        alert('Room not found. Please check the ID and try again.');
    }
}

// Navigate to room
function navigateToRoom(roomId) {
    // Hide all views
    views.forEach(view => view.classList.remove('active'));
    
    // Show room view
    roomView.classList.remove('hidden');
    roomView.classList.add('active');
    
    // Get room data
    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const room = rooms[roomId];
    
    if (room) {
        currentRoom = room;
        currentRoomId = roomId;
        
        // Update room info
        roomTitle.textContent = room.name;
        roomIdDisplay.textContent = `Room ID: ${room.id}`;
        
        // Show player info
        playerInfo.classList.remove('hidden');
        
        // Initialize game
        initRoomGame();
        
        // Update player list
        updatePlayersList();
    } else {
        alert('Room not found!');
        setActiveTab('home');
    }
}

// Handle share room
function handleShareRoom() {
    if (currentRoomId) {
        // Show modal
        shareModal.style.display = 'block';
        
        // Set room ID
        modalRoomId.textContent = currentRoomId;
        
        // Generate QR code
        generateQRCode();
    }
}

// Generate QR code
function generateQRCode() {
    // Clear existing QR code
    qrCodeElement.innerHTML = '';
    
    // Generate room URL
    const roomUrl = window.location.href.split('?')[0] + '?room=' + currentRoomId;
    
    // Create QR code
    new QRCode(qrCodeElement, {
        text: roomUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Handle copy link
function handleCopyLink() {
    const roomUrl = window.location.href.split('?')[0] + '?room=' + currentRoomId;
    
    // Copy to clipboard
    navigator.clipboard.writeText(roomUrl)
        .then(() => {
            alert('Room link copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
        });
}

// Initialize room game
function initRoomGame() {
    // Clear questions container
    questionsContainer.innerHTML = '';
    resultsContainer.classList.add('hidden');
    score = 0;
    
    // Create questions from room characters
    currentRoom.characters.forEach((character, index) => {
        createQuestion(character, index);
    });
    
    totalQuestions.textContent = currentRoom.characters.length;
}

// Create a question element
function createQuestion(character, index) {
    const questionElement = document.createElement('div');
    questionElement.className = 'question-container';
    questionElement.id = `question-${index}`;
    
    const questionHTML = `
        <div class="question-title">Question ${index + 1}: What character has this color palette?</div>
        <div class="color-palette">
            ${character.colors.map(color => `<div class="color-box" style="background-color: ${color};"></div>`).join('')}
        </div>
        <div class="answer-input">
            <input type="text" id="answer-${index}" placeholder="Enter character name...">
            <button class="check-btn" data-index="${index}">Check</button>
        </div>
        <div class="feedback" id="feedback-${index}"></div>
    `;
    
    questionElement.innerHTML = questionHTML;
    questionsContainer.appendChild(questionElement);
    
    // Add event listener to the check button
    const checkBtn = questionElement.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
        checkAnswer(index);
    });
    
    // Add event listener for Enter key
    const input = questionElement.querySelector(`#answer-${index}`);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer(index);
        }
    });
}

// Check the answer for a question
function checkAnswer(index) {
    const input = document.getElementById(`answer-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = currentRoom.characters[index].name.toLowerCase();
    
    if (userAnswer === correctAnswer) {
        feedback.textContent = `Correct! It's ${currentRoom.characters[index].name}!`;
        feedback.className = 'feedback correct';
        input.disabled = true;
        document.querySelector(`[data-index="${index}"]`).disabled = true;
        score++;
        
        // Update player score
        updatePlayerScore();
    } else {
        feedback.textContent = `Incorrect. Try again!`;
        feedback.className = 'feedback incorrect';
    }
    
    // Check if all questions are answered
    const disabledInputs = document.querySelectorAll('input[id^="answer-"]:disabled').length;
    if (disabledInputs === currentRoom.characters.length) {
        showResults();
    }
}

// Update player score
function updatePlayerScore() {
    if (currentRoom && currentRoomId) {
        // Get rooms
        let rooms = JSON.parse(localStorage.getItem('rooms')) || {};
        
        // Update player score
        const playerIndex = rooms[currentRoomId].players.findIndex(player => player.id === currentUserId);
        if (playerIndex >= 0) {
            rooms[currentRoomId].players[playerIndex].score = score;
            currentRoom = rooms[currentRoomId];
            
            // Save back to localStorage
            localStorage.setItem('rooms', JSON.stringify(rooms));
            
            // Update player list
            updatePlayersList();
        }
    }
}

// Update players list
function updatePlayersList() {
    if (currentRoom && currentRoom.players) {
        // Sort players by score
        const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);
        
        // Clear container
        playersContainer.innerHTML = '';
        
        // Add player items
        sortedPlayers.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            
            // Highlight current user
            if (player.id === currentUserId) {
                playerElement.style.backgroundColor = '#e8f4fc';
            }
            
            playerElement.innerHTML = `
                <div class="player-name">${player.name}</div>
                <div class="player-score">Score: ${player.score}</div>
            `;
            
            playersContainer.appendChild(playerElement);
        });
    }
}

// Show the results
function showResults() {
    scoreCount.textContent = score;
    resultsContainer.classList.remove('hidden');
}

// Reset game
function resetGame() {
    initRoomGame();
}

// Check for room ID in URL
function checkUrlForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (roomId) {
        joinRoom(roomId);
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
    init();
    checkUrlForRoom();
});