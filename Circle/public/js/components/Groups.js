class GroupsComponent {
    constructor(app) {
        this.app = app;
        this.elements = {
            container: document.getElementById('groupsList'),
            createModal: document.getElementById('createGroupModal'),
            joinModal: document.getElementById('joinGroupModal'),
            createForm: document.getElementById('createGroupSubmit'),
            joinForm: document.getElementById('joinGroupSubmit'),
            groupNameInput: document.getElementById('groupNameInput'),
            groupDescInput: document.getElementById('groupDescInput'),
            memberSearch: document.getElementById('memberSearch'),
            memberResults: document.getElementById('memberSearchResults'),
            selectedMembers: document.getElementById('selectedMembers')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.createForm.addEventListener('click', () => this.handleCreateGroup());
        this.elements.joinForm.addEventListener('click', () => this.handleJoinGroup());
        this.elements.memberSearch.addEventListener('input', debounce((e) => this.handleMemberSearch(e.target.value), 300));
    }

    async render() {
        try {
            const groups = await this.app.services.group.getGroups();
            this.app.state.groups = groups;
            this.renderGroups(groups);
        } catch (error) {
            console.error('Failed to render groups:', error);
            this.app.showError('Failed to load groups');
        }
    }

    renderGroups(groups) {
        this.elements.container.innerHTML = groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-avatar">
                    <img src="${group.avatar || 'default-group.png'}" alt="${group.name}">
                </div>
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <p>${group.description || 'No description'}</p>
                    <span class="member-count">${group.memberCount} members</span>
                </div>
            </div>
        `).join('');

        // Add click handlers to group cards
        this.elements.container.querySelectorAll('.group-card').forEach(card => {
            card.addEventListener('click', () => this.handleGroupSelect(card.dataset.groupId));
        });
    }

    showCreateModal() {
        this.elements.createModal.classList.remove('hidden');
    }

    showJoinModal() {
        this.elements.joinModal.classList.remove('hidden');
    }

    async handleCreateGroup() {
        const name = this.elements.groupNameInput.value.trim();
        const description = this.elements.groupDescInput.value.trim();
        const members = Array.from(this.elements.selectedMembers.children).map(el => el.dataset.userId);

        if (!name) {
            this.app.showError('Please enter a group name');
            return;
        }

        try {
            const group = await this.app.services.group.createGroup({
                name,
                description,
                members
            });

            this.app.state.groups.push(group);
            this.renderGroups(this.app.state.groups);
            this.app.showSuccess('Group created successfully');
            this.elements.createModal.classList.add('hidden');
        } catch (error) {
            console.error('Failed to create group:', error);
            this.app.showError('Failed to create group');
        }
    }

    async handleJoinGroup() {
        const code = document.getElementById('groupCodeInput').value.trim();

        if (!code) {
            this.app.showError('Please enter a group code');
            return;
        }

        try {
            const group = await this.app.services.group.joinGroup(code);
            this.app.state.groups.push(group);
            this.renderGroups(this.app.state.groups);
            this.app.showSuccess('Joined group successfully');
            this.elements.joinModal.classList.add('hidden');
        } catch (error) {
            console.error('Failed to join group:', error);
            this.app.showError('Failed to join group');
        }
    }

    async handleMemberSearch(query) {
        if (!query.trim()) {
            this.elements.memberResults.innerHTML = '';
            return;
        }

        try {
            const users = await this.app.services.auth.searchUsers(query);
            this.renderMemberResults(users);
        } catch (error) {
            console.error('Failed to search members:', error);
        }
    }

    renderMemberResults(users) {
        this.elements.memberResults.innerHTML = users.map(user => `
            <div class="user-result" data-user-id="${user.id}">
                <img src="${user.avatar || 'default-avatar.png'}" alt="${user.name}">
                <span>${user.name}</span>
            </div>
        `).join('');

        // Add click handlers to user results
        this.elements.memberResults.querySelectorAll('.user-result').forEach(result => {
            result.addEventListener('click', () => this.handleMemberSelect(result.dataset.userId));
        });
    }

    handleMemberSelect(userId) {
        const user = this.app.state.users.find(u => u.id === userId);
        if (!user) return;

        const memberEl = document.createElement('div');
        memberEl.className = 'selected-member';
        memberEl.dataset.userId = userId;
        memberEl.innerHTML = `
            <img src="${user.avatar || 'default-avatar.png'}" alt="${user.name}">
            <span>${user.name}</span>
            <button class="remove-member">
                <span class="material-icons">close</span>
            </button>
        `;

        memberEl.querySelector('.remove-member').addEventListener('click', () => {
            memberEl.remove();
        });

        this.elements.selectedMembers.appendChild(memberEl);
        this.elements.memberResults.innerHTML = '';
    }

    handleGroupSelect(groupId) {
        const group = this.app.state.groups.find(g => g.id === groupId);
        if (!group) return;

        this.app.state.currentGroup = group;
        this.app.components.chat.show();
        this.app.components.chat.loadMessages(groupId);
    }

    updateGroup(data) {
        const index = this.app.state.groups.findIndex(g => g.id === data.id);
        if (index === -1) {
            this.app.state.groups.push(data);
        } else {
            this.app.state.groups[index] = { ...this.app.state.groups[index], ...data };
        }
        this.renderGroups(this.app.state.groups);
    }
} 