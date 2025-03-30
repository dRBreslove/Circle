class ProfileComponent {
    constructor(app) {
        this.app = app;
        this.elements = {
            container: document.getElementById('profileSection'),
            profileImage: document.getElementById('profileImage'),
            changeAvatarBtn: document.getElementById('changeAvatarBtn'),
            nameInput: document.getElementById('profileName'),
            emailInput: document.getElementById('profileEmail'),
            bioInput: document.getElementById('profileBio'),
            saveBtn: document.getElementById('saveProfileBtn'),
            backBtn: document.querySelector('.back-btn')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.changeAvatarBtn.addEventListener('click', () => this.handleAvatarChange());
        this.elements.saveBtn.addEventListener('click', () => this.handleSaveProfile());
        this.elements.backBtn.addEventListener('click', () => this.handleBack());
    }

    show() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        this.elements.container.classList.add('active');
    }

    async loadProfile(userData) {
        try {
            const profile = await this.app.services.auth.getProfile(userData.id);
            this.renderProfile(profile);
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.app.showError('Failed to load profile');
        }
    }

    renderProfile(profile) {
        this.elements.profileImage.src = profile.avatar || 'default-avatar.png';
        this.elements.nameInput.value = profile.name || '';
        this.elements.emailInput.value = profile.email || '';
        this.elements.bioInput.value = profile.bio || '';
    }

    async handleAvatarChange() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const avatarUrl = await this.app.services.auth.uploadAvatar(file);
                this.elements.profileImage.src = avatarUrl;
                this.app.showSuccess('Avatar updated successfully');
            } catch (error) {
                console.error('Failed to upload avatar:', error);
                this.app.showError('Failed to update avatar');
            }
        });

        input.click();
    }

    async handleSaveProfile() {
        const profileData = {
            name: this.elements.nameInput.value.trim(),
            email: this.elements.emailInput.value.trim(),
            bio: this.elements.bioInput.value.trim()
        };

        if (!profileData.name) {
            this.app.showError('Please enter your name');
            return;
        }

        if (!profileData.email) {
            this.app.showError('Please enter your email');
            return;
        }

        try {
            await this.app.services.auth.updateProfile(profileData);
            this.app.showSuccess('Profile updated successfully');
            this.app.state.currentUser = {
                ...this.app.state.currentUser,
                ...profileData
            };
        } catch (error) {
            console.error('Failed to update profile:', error);
            this.app.showError('Failed to update profile');
        }
    }

    handleBack() {
        this.app.components.groups.show();
    }
} 