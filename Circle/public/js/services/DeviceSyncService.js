class DeviceSyncService {
    constructor() {
        this.devices = new Map();
        this.isNFCEnabled = false;
        this.eyeContactEstablished = false;
    }

    syncDevice(userId, deviceData) {
        this.devices.set(userId, deviceData);
    }

    getDeviceData(userId) {
        return this.devices.get(userId);
    }

    removeDevice(userId) {
        this.devices.delete(userId);
    }

    // New method to handle device synchronization
    syncPortraits(userId, partnerId) {
        const userDevice = this.getDeviceData(userId);
        const partnerDevice = this.getDeviceData(partnerId);

        if (userDevice && partnerDevice) {
            // Logic to sync portraits
            console.log(`Syncing portraits for user ${userId} and partner ${partnerId}`);
            // Ensure devices are normal to the ground
            this.ensureDevicesNormal(userId, partnerId);
        }
    }

    // New method to ensure devices are normal to the ground
    ensureDevicesNormal(userId, partnerId) {
        const userDevice = this.getDeviceData(userId);
        const partnerDevice = this.getDeviceData(partnerId);

        if (userDevice && partnerDevice) {
            this.eyeContactEstablished = true;
            this.currentUserId = userId;
            this.partnerId = partnerId;
            this.showFlashingFrame(userId, partnerId);
            this.showEyeContactGuidance(userId, partnerId);
            this.enableNFC();
        }
    }

    // New method to show flashing frame
    showFlashingFrame(userId, partnerId) {
        console.log(`Showing flashing frame for user ${userId} and partner ${partnerId}`);
        // Logic to display a flashing frame
    }

    // New method to show eye contact guidance
    showEyeContactGuidance(userId, partnerId) {
        console.log(`Showing eye contact guidance for user ${userId} and partner ${partnerId}`);
        // Create and show the guidance label
        const guidanceLabel = document.createElement('div');
        guidanceLabel.className = 'eye-contact-guidance';
        guidanceLabel.textContent = 'Try Bending Down to Keep Eye Contact';
        document.body.appendChild(guidanceLabel);

        // Remove the label after 5 seconds
        setTimeout(() => {
            guidanceLabel.remove();
        }, 5000);
    }

    // New method to check NFC availability and enable it
    async enableNFC() {
        if ('NDEFReader' in window) {
            try {
                const ndef = new NDEFReader();
                await ndef.scan();
                this.isNFCEnabled = true;
                console.log('NFC is enabled and scanning');
                this.setupNFCListeners(ndef);
            } catch (error) {
                console.error('Error enabling NFC:', error);
            }
        } else {
            console.log('NFC not supported on this device');
        }
    }

    // New method to setup NFC listeners
    setupNFCListeners(ndef) {
        ndef.addEventListener('reading', ({ message }) => {
            const record = message.records[0];
            if (record && record.data) {
                const data = JSON.parse(record.data);
                if (data.type === 'circle_sync') {
                    this.handleCircleSync(data);
                }
            }
        });
    }

    // New method to handle circle sync
    handleCircleSync(data) {
        if (this.eyeContactEstablished) {
            this.showCircleItButton();
        }
    }

    // New method to show Circle It button
    showCircleItButton() {
        const button = document.createElement('button');
        button.className = 'circle-it-button';
        button.textContent = 'Circle It!!!';
        button.onclick = () => this.handleCircleItClick();
        document.body.appendChild(button);

        // Remove button after 10 seconds
        setTimeout(() => {
            button.remove();
        }, 10000);
    }

    // New method to handle Circle It button click
    handleCircleItClick() {
        if (this.eyeContactEstablished) {
            // Trigger sync between devices
            this.syncPortraits(this.currentUserId, this.partnerId);
            this.showSuccessMessage('Devices synced successfully!');
        }
    }

    // New method to show success message
    showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'sync-success-message';
        successMessage.textContent = message;
        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }
}

module.exports = DeviceSyncService; 