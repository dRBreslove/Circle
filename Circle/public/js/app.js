// Application state
const state = {
    currentUser: null,
    currentGroup: null,
    groups: [],
    messages: [],
    participants: [],
    isInCall: false,
    callType: null, // 'video' or 'voice'
    isMuted: false,
    isVideoEnabled: true
};

// DOM Elements
const elements = {
    // Navigation
    createGroupBtn: document.getElementById('createGroupBtn'),
    profileBtn: document.getElementById('profileBtn'),
    
    // Sections
    groupsSection: document.getElementById('groupsSection'),
    chatSection: document.getElementById('chatSection'),
    videoCallSection: document.getElementById('videoCallSection'),
    voiceCallSection: document.getElementById('voiceCallSection'),
    profileSection: document.getElementById('profileSection'),
    
    // Groups
    groupSearch: document.getElementById('groupSearch'),
    groupsList: document.getElementById('groupsList'),
    
    // Chat
    currentGroupName: document.getElementById('currentGroupName'),
    participantCount: document.getElementById('participantCount'),
    messagesList: document.getElementById('messagesList'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    attachBtn: document.getElementById('attachBtn'),
    
    // Call Controls
    videoCallBtn: document.getElementById('videoCallBtn'),
    voiceCallBtn: document.getElementById('voiceCallBtn'),
    muteBtn: document.getElementById('muteBtn'),
    videoBtn: document.getElementById('videoBtn'),
    endCallBtn: document.getElementById('endCallBtn'),
    
    // Profile
    profileImage: document.getElementById('profileImage'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileBio: document.getElementById('profileBio'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Modals
    createGroupModal: document.getElementById('createGroupModal'),
    joinGroupModal: document.getElementById('joinGroupModal'),
    groupNameInput: document.getElementById('groupNameInput'),
    groupDescInput: document.getElementById('groupDescInput'),
    memberSearch: document.getElementById('memberSearch'),
    memberSearchResults: document.getElementById('memberSearchResults'),
    selectedMembers: document.getElementById('selectedMembers'),
    groupCodeInput: document.getElementById('groupCodeInput')
};

// Initialize application
async function initApp() {
    try {
        // Initialize services
        await AuthService.init();
        await WebSocketService.init();
        await WebRTCService.init();
        
        // Load user data
        state.currentUser = await AuthService.getCurrentUser();
        if (!state.currentUser) {
            window.location.href = '/login.html';
            return;
        }
        
        // Load user's groups
        state.groups = await GroupService.getUserGroups();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render initial view
        renderGroups();
        
        // Setup WebSocket listeners
        setupWebSocketListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.createGroupBtn.addEventListener('click', showCreateGroupModal);
    elements.profileBtn.addEventListener('click', showProfile);
    
    // Chat
    elements.messageInput.addEventListener('keypress', handleMessageInput);
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.attachBtn.addEventListener('click', handleAttachment);
    
    // Calls
    elements.videoCallBtn.addEventListener('click', () => startCall('video'));
    elements.voiceCallBtn.addEventListener('click', () => startCall('voice'));
    elements.muteBtn.addEventListener('click', toggleMute);
    elements.videoBtn.addEventListener('click', toggleVideo);
    elements.endCallBtn.addEventListener('click', endCall);
    
    // Profile
    elements.saveProfileBtn.addEventListener('click', saveProfile);
    elements.profileImage.addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    
    // Modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });
    
    // Group creation
    document.getElementById('createGroupSubmit').addEventListener('click', createGroup);
    document.getElementById('joinGroupSubmit').addEventListener('click', joinGroup);
    
    // Search
    elements.groupSearch.addEventListener('input', debounce(handleGroupSearch, 300));
    elements.memberSearch.addEventListener('input', debounce(handleMemberSearch, 300));
}

// WebSocket Listeners
function setupWebSocketListeners() {
    WebSocketService.on('group_update', handleGroupUpdate);
    WebSocketService.on('message', handleNewMessage);
    WebSocketService.on('participant_join', handleParticipantJoin);
    WebSocketService.on('participant_leave', handleParticipantLeave);
    WebSocketService.on('call_request', handleCallRequest);
    WebSocketService.on('call_accepted', handleCallAccepted);
    WebSocketService.on('call_rejected', handleCallRejected);
    WebSocketService.on('call_ended', handleCallEnded);
}

// UI Updates
function renderGroups() {
    elements.groupsList.innerHTML = '';
    state.groups.forEach(group => {
        const groupElement = createGroupElement(group);
        elements.groupsList.appendChild(groupElement);
    });
}

function createGroupElement(group) {
    const div = document.createElement('div');
    div.className = 'group-card';
    div.innerHTML = `
        <div class="group-info">
            <h3>${group.name}</h3>
            <p>${group.description || 'No description'}</p>
            <span>${group.participants.length} participants</span>
        </div>
        <div class="group-actions">
            <button class="btn icon" onclick="joinGroup('${group.id}')">
                <span class="material-icons">group_add</span>
            </button>
            <button class="btn icon" onclick="startChat('${group.id}')">
                <span class="material-icons">chat</span>
            </button>
        </div>
    `;
    return div;
}

function renderMessages() {
    elements.messagesList.innerHTML = '';
    state.messages.forEach(message => {
        const messageElement = createMessageElement(message);
        elements.messagesList.appendChild(messageElement);
    });
    elements.messagesList.scrollTop = elements.messagesList.scrollHeight;
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.userId === state.currentUser.id ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${message.userName}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="message-text">${message.text}</div>
            ${message.attachment ? `<div class="message-attachment">${message.attachment}</div>` : ''}
        </div>
    `;
    return div;
}

// Navigation
function showProfile() {
    hideAllSections();
    elements.profileSection.classList.add('active');
    loadProfileData();
}

function showChat(groupId) {
    hideAllSections();
    elements.chatSection.classList.add('active');
    loadChatData(groupId);
}

function showVideoCall() {
    hideAllSections();
    elements.videoCallSection.classList.add('active');
    startVideoCall();
}

function showVoiceCall() {
    hideAllSections();
    elements.voiceCallSection.classList.add('active');
    startVoiceCall();
}

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
}

// Group Management
async function createGroup() {
    try {
        const groupData = {
            name: elements.groupNameInput.value,
            description: elements.groupDescInput.value,
            members: getSelectedMembers()
        };
        
        const newGroup = await GroupService.createGroup(groupData);
        state.groups.push(newGroup);
        renderGroups();
        hideModals();
        showChat(newGroup.id);
    } catch (error) {
        console.error('Error creating group:', error);
        showError('Failed to create group');
    }
}

async function joinGroup(groupId) {
    try {
        const group = await GroupService.joinGroup(groupId);
        state.groups.push(group);
        renderGroups();
        showChat(groupId);
    } catch (error) {
        console.error('Error joining group:', error);
        showError('Failed to join group');
    }
}

// Chat Management
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text) return;
    
    try {
        const message = await ChatService.sendMessage(state.currentGroup.id, text);
        state.messages.push(message);
        renderMessages();
        elements.messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
}

async function handleAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const attachment = await ChatService.uploadAttachment(file);
            const message = await ChatService.sendMessage(state.currentGroup.id, '', attachment);
            state.messages.push(message);
            renderMessages();
        } catch (error) {
            console.error('Error uploading attachment:', error);
            showError('Failed to upload attachment');
        }
    };
    
    input.click();
}

// Call Management
async function startCall(type) {
    try {
        state.callType = type;
        state.isInCall = true;
        
        if (type === 'video') {
            showVideoCall();
        } else {
            showVoiceCall();
        }
        
        await WebRTCService.startCall(state.currentGroup.id, type);
    } catch (error) {
        console.error('Error starting call:', error);
        showError('Failed to start call');
    }
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    WebRTCService.setMute(state.isMuted);
    elements.muteBtn.querySelector('.material-icons').textContent = 
        state.isMuted ? 'mic_off' : 'mic';
}

function toggleVideo() {
    state.isVideoEnabled = !state.isVideoEnabled;
    WebRTCService.setVideoEnabled(state.isVideoEnabled);
    elements.videoBtn.querySelector('.material-icons').textContent = 
        state.isVideoEnabled ? 'videocam' : 'videocam_off';
}

async function endCall() {
    try {
        await WebRTCService.endCall();
        state.isInCall = false;
        showChat(state.currentGroup.id);
    } catch (error) {
        console.error('Error ending call:', error);
        showError('Failed to end call');
    }
}

// Profile Management
async function loadProfileData() {
    try {
        const profile = await AuthService.getUserProfile();
        elements.profileName.value = profile.name;
        elements.profileEmail.value = profile.email;
        elements.profileBio.value = profile.bio || '';
        if (profile.avatar) {
            elements.profileImage.src = profile.avatar;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

async function saveProfile() {
    try {
        const profileData = {
            name: elements.profileName.value,
            email: elements.profileEmail.value,
            bio: elements.profileBio.value
        };
        
        await AuthService.updateProfile(profileData);
        showSuccess('Profile updated successfully');
    } catch (error) {
        console.error('Error saving profile:', error);
        showError('Failed to save profile');
    }
}

// Utility Functions
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    // Implement error notification
    console.error(message);
}

function showSuccess(message) {
    // Implement success notification
    console.log(message);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 