// Thirupugazh Song List Generator - Client-side JavaScript

// Application State
const AppState = {
    currentPlaylist: [],
    isGenerating: false,
    connectionStatus: 'connected',
    chatHistory: [],
    alankaaramData: {}, // Stores Alankaaram checkbox states and times
    selectedPrarthanai: null,
    selectedFunction: null,
    selectedMember: null,
    bhajanDetails: {
        date: '',
        startTime: '',
        endTime: '',
        day: ''
    },
    playlistHeaderData: null
};

// API Base URL
const API_BASE = window.location.origin;

// DOM Elements
const elements = {
    // Forms and inputs
    playlistForm: document.getElementById('playlistForm'),
    durationInput: document.getElementById('durationInput'),
    generateBtn: document.getElementById('generateBtn'),
    chatInput: document.getElementById('chatInput'),
    chatBtn: document.getElementById('chatBtn'),
    
    // New section elements
    prarthanaiContainer: document.getElementById('prarthanaiContainer'),
    selectedPrarthanaiDisplay: document.getElementById('selectedPrarthanaiDisplay'),
    selectedPrarthanaiText: document.getElementById('selectedPrarthanaiText'),
    prarthanaiToggle: document.getElementById('prarthanaiToggle'),
    prarthanaiCollapse: document.getElementById('prarthanaiCollapse'),
    
    functionContainer: document.getElementById('functionContainer'),
    selectedFunctionDisplay: document.getElementById('selectedFunctionDisplay'),
    selectedFunctionText: document.getElementById('selectedFunctionText'),
    functionToggle: document.getElementById('functionToggle'),
    functionCollapse: document.getElementById('functionCollapse'),
    
    memberContainer: document.getElementById('memberContainer'),
    selectedMemberDisplay: document.getElementById('selectedMemberDisplay'),
    selectedMemberName: document.getElementById('selectedMemberName'),
    selectedMemberAddress: document.getElementById('selectedMemberAddress'),
    selectedMemberPhone: document.getElementById('selectedMemberPhone'),
    bhajanToggle: document.getElementById('bhajanToggle'),
    bhajanCollapse: document.getElementById('bhajanCollapse'),
    
    bhajanDate: document.getElementById('bhajanDate'),
    bhajanStartTime: document.getElementById('bhajanStartTime'),
    bhajanEndTime: document.getElementById('bhajanEndTime'),
    bhajanDay: document.getElementById('bhajanDay'),
    
    // Status and display
    playlistStats: document.getElementById('playlistStats'),
    
    // Content areas
    emptyState: document.getElementById('emptyState'),
    playlistContainer: document.getElementById('playlistContainer'),
    playlistTableBody: document.getElementById('playlistTableBody'),
    chatMessages: document.getElementById('chatMessages'),
    
    // Action buttons
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    clearPlaylistBtn: document.getElementById('clearPlaylistBtn'),
    
    // Modals and toasts
    loadingModal: document.getElementById('loadingModal')
};

// Utility Functions
class Utils {
    static formatDuration(durationStr) {
        if (!durationStr) return '0:00';
        const parts = durationStr.split('.');
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    static formatTotalDuration(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    static calculateTotalDuration(playlist) {
        return playlist.reduce((total, song) => {
            const parts = (song.duration || '0.0').split('.');
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return total + (minutes * 60) + seconds;
        }, 0);
    }
    
    static showToast(type, message) {
        const toastElement = document.getElementById('notificationToast');
        const toastHeader = document.getElementById('toastHeader');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastBody = document.getElementById('toastBody');
        
        if (toastElement && toastHeader && toastIcon && toastTitle && toastBody) {
            // Reset classes
            toastHeader.className = 'toast-header';
            toastIcon.className = 'me-2';
            
            // Configure based on type
            if (type === 'error') {
                toastHeader.classList.add('bg-danger', 'text-white');
                toastIcon.classList.add('bi', 'bi-exclamation-triangle-fill');
                toastTitle.textContent = 'Error';
                const closeBtn = toastHeader.querySelector('.btn-close');
                if (closeBtn) closeBtn.classList.add('btn-close-white');
            } else if (type === 'success') {
                toastHeader.classList.add('bg-success', 'text-white');
                toastIcon.classList.add('bi', 'bi-check-circle-fill');
                toastTitle.textContent = 'Success';
                const closeBtn = toastHeader.querySelector('.btn-close');
                if (closeBtn) closeBtn.classList.add('btn-close-white');
            } else if (type === 'warning') {
                toastHeader.classList.add('bg-warning', 'text-dark');
                toastIcon.classList.add('bi', 'bi-exclamation-circle-fill');
                toastTitle.textContent = 'Warning';
                const closeBtn = toastHeader.querySelector('.btn-close');
                if (closeBtn) closeBtn.classList.remove('btn-close-white');
            } else {
                toastHeader.classList.add('bg-info', 'text-white');
                toastIcon.classList.add('bi', 'bi-info-circle-fill');
                toastTitle.textContent = 'Info';
                const closeBtn = toastHeader.querySelector('.btn-close');
                if (closeBtn) closeBtn.classList.add('btn-close-white');
            }
            
            toastBody.textContent = message;
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.show();
        }
    }
    
    static showModal(modal) {
        // Always get or create a single instance
        let bsModal = bootstrap.Modal.getInstance(modal);
        if (!bsModal) {
            bsModal = new bootstrap.Modal(modal);
        }
        bsModal.show();
        return bsModal;
    }
    
    static hideModal(modalInstance) {
        try {
            if (modalInstance) {
                modalInstance.hide();
            }
            
            // Additional safety check - find any visible modals and force close them
            const visibleModals = document.querySelectorAll('.modal.show');
            visibleModals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
                
                // Force close if still visible
                if (modal.classList.contains('show')) {
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                    modal.removeAttribute('aria-modal');
                }
            });
            
            // Clean up any lingering backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Restore body state
            if (!document.querySelector('.modal.show')) {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
    }
    
    static forceCloseModal() {
        try {
            console.log('Force closing modal with multiple strategies...');
            
            const modalElement = elements.loadingModal;
            
            // Strategy 1: Use Bootstrap Modal instance if available
            const bsModal = bootstrap.Modal.getInstance(modalElement);
            if (bsModal) {
                console.log('Closing via Bootstrap instance');
                bsModal.hide();
                
                // Wait for Bootstrap to complete its hiding animation
                setTimeout(() => {
                    if (modalElement.classList.contains('show')) {
                        console.log('Bootstrap hide incomplete, applying force close');
                        Utils.forceCloseModalDirect();
                    }
                }, 300);
            } else {
                console.log('No Bootstrap instance found, applying direct close');
                Utils.forceCloseModalDirect();
            }
            
        } catch (error) {
            console.error('Error in forceCloseModal:', error);
            Utils.forceCloseModalDirect();
        }
    }
    
    static forceCloseModalDirect() {
        try {
            const modalElement = elements.loadingModal;
            
            console.log('Applying direct DOM manipulation');
            
            // Remove Bootstrap classes
            modalElement.classList.remove('show', 'fade');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            
            // Remove all modal backdrops
            const allBackdrops = document.querySelectorAll('.modal-backdrop');
            allBackdrops.forEach(backdrop => {
                console.log('Removing backdrop');
                backdrop.remove();
            });
            
            // Reset body state
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.style.marginRight = '';
            
            // Force re-add fade class for future animations
            setTimeout(() => {
                modalElement.classList.add('fade');
            }, 100);
            
            console.log('Direct force close completed');
            
        } catch (error) {
            console.error('Error in forceCloseModalDirect:', error);
        }
    }
    

}

// API Service
class ApiService {
    static async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async generatePlaylist(duration, headerData) {
        return this.makeRequest('/api/generate-playlist', {
            method: 'POST',
            body: JSON.stringify({ 
                duration,
                headerData: headerData || {}
            })
        });
    }

    static async sendChatMessage(message, playlist) {
        return this.makeRequest('/api/llm-chat', {
            method: 'POST',
            body: JSON.stringify({ message, playlist })
        });
    }

    static async getSongsByAlbum(albumName) {
        return this.makeRequest(`/api/songs/${encodeURIComponent(albumName)}`);
    }

    static async searchSongs(query, options = {}) {
        const params = new URLSearchParams({ query });
        if (options.albumFilter) params.append('albumFilter', options.albumFilter);
        if (options.minScore) params.append('minScore', options.minScore.toString());
        if (options.maxResults) params.append('maxResults', options.maxResults.toString());
        
        return this.makeRequest(`/api/search-songs?${params.toString()}`);
    }

    static async checkHealth() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                AppState.connectionStatus = 'connected';
            } else {
                AppState.connectionStatus = 'disconnected';
            }
        } catch (error) {
            console.log('Health check failed (server may be starting):', error.message);
            AppState.connectionStatus = 'disconnected';
        }
    }
}

// PDF Export Service - Server-side generation
class PdfService {
    static async exportPlaylist(playlist) {
        try {
            Utils.showToast('info', 'Generating PDF... Please wait.');
            
            const response = await fetch(`${API_BASE}/api/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    playlist,
                    alankaaramData: AppState.alankaaramData || {},
                    headerData: AppState.playlistHeaderData || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the PDF blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'thirupugazh-playlist.pdf';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            a.download = filename;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            Utils.showToast('success', 'PDF exported successfully!');
        } catch (error) {
            console.error('PDF Export Error:', error);
            Utils.showToast('error', 'Failed to export PDF. Please try again.');
        }
    }
}

// Playlist Manager
class PlaylistManager {
    static renderPlaylist(playlist) {
        AppState.currentPlaylist = playlist;
        AppState.alankaaramData = {}; // Clear Alankaaram data for new playlist
        
        if (!playlist || playlist.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        this.renderPlaylistHeader();
        this.updatePlaylistTable(playlist);
        this.updatePlaylistStats(playlist);
        this.enableActions();
    }
    
    static showEmptyState() {
        elements.emptyState.classList.remove('d-none');
        elements.playlistContainer.classList.add('d-none');
        elements.playlistStats.textContent = 'No playlist generated';
        this.disableActions();
    }
    
    static hideEmptyState() {
        elements.emptyState.classList.add('d-none');
        elements.playlistContainer.classList.remove('d-none');
    }
    
    static updatePlaylistTable(playlist) {
        const tbody = elements.playlistTableBody;
        tbody.innerHTML = '';
        
        playlist.forEach((song, index) => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td class="text-center fw-bold">${index + 1}</td>
                <td class="text-tamil">${song.title || ''}</td>
                <td>${song.songNumber || ''}</td>
                <td class="text-tamil">${song.raga || ''}</td>
                <td class="text-tamil">${song.album || ''}</td>
                <td class="text-center">
                    <div class="alankaaram-container d-flex align-items-center justify-content-center gap-2">
                        <div class="form-check mb-0">
                            <input class="form-check-input alankaaram-checkbox" type="checkbox" 
                                   data-song-index="${index}" id="alankaaram-${index}">
                        </div>
                        <div class="alankaaram-time-container d-none">
                            <div class="input-group input-group-sm">
                                <input type="number" class="form-control alankaaram-time" 
                                       value="4" min="1" max="30" 
                                       data-song-index="${index}"
                                       style="width: 60px;">
                                <span class="input-group-text">min</span>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    static updatePlaylistStats(playlist) {
        const totalDuration = Utils.calculateTotalDuration(playlist);
        const songCount = playlist.length;
        elements.playlistStats.innerHTML = `
            ${songCount} songs • ${Utils.formatTotalDuration(totalDuration)}
        `;
    }
    
    static enableActions() {
        elements.exportPdfBtn.disabled = false;
        elements.clearPlaylistBtn.disabled = false;
        elements.chatInput.disabled = false;
        elements.chatBtn.disabled = false;
    }
    
    static renderPlaylistHeader() {
        const headerData = AppState.playlistHeaderData;
        
        console.log('Rendering playlist header with data:', headerData);
        console.log('AppState selections:', {
            selectedPrarthanai: AppState.selectedPrarthanai,
            selectedFunction: AppState.selectedFunction,
            selectedMember: AppState.selectedMember,
            bhajanDetails: AppState.bhajanDetails
        });
        
        // Remove existing header if any
        const existingHeader = document.getElementById('playlistHeader');
        if (existingHeader) {
            existingHeader.remove();
        }
        
        // Only render header if we have data
        const hasHeaderData = headerData && (
            headerData.selectedPrarthanai || 
            headerData.selectedFunction || 
            headerData.selectedMember || 
            (headerData.bhajanDetails && (headerData.bhajanDetails.date || headerData.bhajanDetails.startTime || headerData.bhajanDetails.endTime))
        );
        
        if (!hasHeaderData) {
            console.log('No header data to render or insufficient data');
            return;
        }
        
        const playlistContainer = elements.playlistContainer;
        const headerDiv = document.createElement('div');
        headerDiv.id = 'playlistHeader';
        headerDiv.className = 'card-header bg-info text-white mb-3 text-center';
        
        let headerContent = '';
        
        // Line 1: Prarthanai
        if (headerData.selectedPrarthanai) {
            headerContent += `<div class="mb-2">${headerData.selectedPrarthanai.text}</div>`;
        }
        
        // Line 2: Function
        if (headerData.selectedFunction) {
            headerContent += `<div class="mb-2 fw-bold">${headerData.selectedFunction.name}</div>`;
        }
        
        // Line 3: Date, Day, Time
        if (headerData.bhajanDetails && (headerData.bhajanDetails.date || headerData.bhajanDetails.startTime || headerData.bhajanDetails.endTime)) {
            let line3Content = [];
            
            if (headerData.bhajanDetails.date) {
                const dateObj = new Date(headerData.bhajanDetails.date);
                const formattedDate = dateObj.toLocaleDateString('en-IN');
                line3Content.push(formattedDate);
            }
            
            if (headerData.bhajanDetails.day) {
                line3Content.push(headerData.bhajanDetails.day);
            }
            
            if (headerData.bhajanDetails.startTime) {
                const startTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.startTime}`);
                const formattedStartTime = startTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                
                if (headerData.bhajanDetails.endTime) {
                    const endTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.endTime}`);
                    const formattedEndTime = endTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    line3Content.push(`${formattedStartTime} - ${formattedEndTime}`);
                } else {
                    line3Content.push(formattedStartTime);
                }
            } else if (headerData.bhajanDetails.endTime) {
                const endTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.endTime}`);
                const formattedEndTime = endTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                line3Content.push(`Until ${formattedEndTime}`);
            }
            
            if (line3Content.length > 0) {
                headerContent += `<div class="mb-2">${line3Content.join(' | ')}</div>`;
            }
        }
        
        // Line 4: Host details
        if (headerData.selectedMember) {
            headerContent += `
                <div class="mb-0">
                    ${headerData.selectedMember.name}<br>
                    <small class="text-light">
                        ${headerData.selectedMember.address}<br>
                        ${headerData.selectedMember.phone_numbers.join(', ')}
                    </small>
                </div>
            `;
        }
        
        headerDiv.innerHTML = headerContent;
        
        // Insert header before the table
        playlistContainer.insertBefore(headerDiv, playlistContainer.firstChild);
    }
    
    static disableActions() {
        elements.exportPdfBtn.disabled = true;
        elements.clearPlaylistBtn.disabled = true;
        elements.chatInput.disabled = true;
        elements.chatBtn.disabled = true;
    }
    
    static clearPlaylist() {
        AppState.currentPlaylist = [];
        AppState.alankaaramData = {}; // Clear Alankaaram data
        this.showEmptyState();
        Utils.showToast('success', 'Playlist cleared successfully!');
    }
    

}

// Album Order Hierarchy - Following 13-step sequence from SRS
class PlaylistOrder {
    static albumHierarchy = [
        'விநாயகர் துதி',           // Steps 1-2: கைத்தலம் + additional
        'விநாயகர் நாமாவளி',         // Step 3
        'குரு வணக்கம்',             // Step 4
        'திருப்பரங்குன்றம்',          // Step 5a
        'திருசெந்தூர்',              // Step 5b
        'திருப்பழனி',               // Step 5c
        'ஸ்வாமி மலை',              // Step 5d
        'திருத்தணிகை',              // Step 5e
        'பொதுப் பாடல்கள்',           // Step 6 (Minimum 3 Required) - ALL பொதுப் பாடல்கள் come here
        'பஞ்சபூதம் காஞ்சீபுரம்',     // Step 7a (moved after பொதுப் பாடல்கள்)
        'பஞ்சபூதம் திரு ஆனைகாவல்', // Step 7b
        'பஞ்சபூதம் திரு அருணை',    // Step 7c
        'பஞ்சபூதம் திருக் காளஹஸ்தி', // Step 7d
        'பஞ்சபூதம் திரு சிதம்பரம்',  // Step 7e
        'பழமுதிர் சோலை',            // Step 8
        'கந்தர் அனுபூதி',            // Step 9
        'வே, ம, சே',                // Step 10
        'விரு',                      // Step 11
        'மகுடம்',                    // Step 12
        'வகுப்பு',                   // Step 13
        'பூஜோபசாரங்கள்',           // Step 14 (Compulsory)
        'ஏறுமயில்',                // Step 15 (Compulsory)
        'ப்ரார்த்தனை'              // Step 16 (Compulsory)
    ];

    static normalizeAlbumName(albumName) {
        if (!albumName) return '';
        
        // Handle common English to Tamil mappings
        const albumMappings = {
            // General songs variations
            'podhu paadalgal': 'பொதுப் பாடல்கள்',
            'general songs': 'பொதுப் பாடல்கள்',
            'podhu': 'பொதுப் பாடல்கள்',
            
            // Vinayagar thuthi variations
            'vinayagar thuthi': 'விநாயகர் துதி',
            'vinayagar': 'விநாயகர் துதி',
            
            // Vinayagar namavali variations
            'vinayagar namavali': 'விநாயகர் நாமாவளி',
            'namavali': 'விநாயகர் நாமாவளி',
            
            // Guru vanakkam variations
            'guru vanakkam': 'குரு வணக்கம்',
            'guru': 'குரு வணக்கம்',
            
            // Five abodes variations
            'thiruparankundram': 'திருப்பரங்குன்றம்',
            'parankundram': 'திருப்பரங்குன்றம்',
            'thiruchendur': 'திருசெந்தூர்',
            'tiruchendur': 'திருசெந்தூர்',
            'chendur': 'திருசெந்தூர்',
            'thirupazhanee': 'திருப்பழனி',
            'thiruppalani': 'திருப்பழனி',
            'pazhani': 'திருப்பழனி',
            'palani': 'திருப்பழனி',
            'pazhanee': 'திருப்பழனி',
            'swami malai': 'ஸ்வாமி மலை',
            'swamalai': 'ஸ்வாமி மலை',
            'thiruthanigai': 'திருத்தணிகை',
            'thanigai': 'திருத்தணிகை',
            
            // Other albums
            'pazhamudirsolai': 'பழமுதிர் சோலை',
            'pazhamuddir': 'பழமுதிர் சோலை',
            'kandhar anubhooti': 'கந்தர் அனுபூதி',
            'anubhooti': 'கந்தர் அனுபூதி',
            've ma se': 'வே, ம, சே',
            'vemase': 'வே, ம, சே',
            'viru': 'விரு',
            'makudam': 'மகுடம்',
            'vakuppu': 'வகுப்பு',
            'poojopacharangal': 'பூஜோபசாரங்கள்',
            'pooja': 'பூஜோபசாரங்கள்',
            'erumayil': 'ஏறுமயில்',
            'prarthana': 'ப்ரார்த்தனை',
            'prarthanai': 'ப்ரார்த்தனை'
        };
        
        // Normalize to lowercase for mapping lookup
        const normalized = albumName.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Check for exact mappings first
        if (albumMappings[normalized]) {
            return albumMappings[normalized];
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(albumMappings)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return value;
            }
        }
        
        return albumName;
    }

    static getAlbumOrder(albumName) {
        // Normalize the album name first
        const normalizedAlbum = this.normalizeAlbumName(albumName);
        
        // Handle Pancha Bhoota albums that might have different names
        if (normalizedAlbum.startsWith('பஞ்சபூதம் ')) {
            const exactMatch = this.albumHierarchy.findIndex(album => album === normalizedAlbum);
            if (exactMatch !== -1) return exactMatch;
            
            // If not exact match, find first Pancha Bhoota position
            return this.albumHierarchy.findIndex(album => album.startsWith('பஞ்சபூதம் '));
        }
        
        const index = this.albumHierarchy.indexOf(normalizedAlbum);
        
        // Debug logging
        if (index === -1) {
            console.log('Album not found in hierarchy:', { 
                original: albumName, 
                normalized: normalizedAlbum,
                hierarchy: this.albumHierarchy 
            });
        }
        
        return index !== -1 ? index : this.albumHierarchy.length; // Unknown albums go at end
    }

    static findCorrectPosition(playlist, newSongAlbum) {
        const newAlbumOrder = this.getAlbumOrder(newSongAlbum);
        
        // Find the correct insertion position
        for (let i = 0; i < playlist.length; i++) {
            const currentAlbumOrder = this.getAlbumOrder(playlist[i].album);
            if (newAlbumOrder < currentAlbumOrder) {
                return i; // Insert before this position
            }
        }
        
        return playlist.length; // Add at end if no better position found
    }

    static sortPlaylist(playlist) {
        return [...playlist].sort((a, b) => {
            const orderA = this.getAlbumOrder(a.album);
            const orderB = this.getAlbumOrder(b.album);
            return orderA - orderB;
        });
    }
}

// Chat Manager
class ChatManager {
    static addMessage(message, type = 'user') {
        const chatContainer = elements.chatMessages;
        chatContainer.classList.remove('d-none');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type} fade-in`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="timestamp">${timestamp}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Store in history
        AppState.chatHistory.push({ message, type, timestamp });
        
        // Limit chat history to last 50 messages
        if (AppState.chatHistory.length > 50) {
            AppState.chatHistory = AppState.chatHistory.slice(-50);
            // Remove old message elements
            const messages = chatContainer.querySelectorAll('.chat-message');
            if (messages.length > 50) {
                messages[0].remove();
            }
        }
    }
    
    static async sendMessage(message) {
        if (!message.trim() || AppState.currentPlaylist.length === 0) return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        elements.chatInput.value = '';
        
        // Show loading state
        elements.chatBtn.disabled = true;
        elements.chatBtn.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
        
        try {
            const response = await ApiService.sendChatMessage(message, AppState.currentPlaylist);
            
            // Try to parse and execute any JSON commands in the response first
            let jsonCommandsExecuted = false;
            let displayableResponse = response.response;
            
            try {
                // Look for both single objects and arrays
                const jsonArrayMatch = response.response.match(/\[[\s\S]*?\]/);
                const jsonObjectMatch = response.response.match(/\{[^}]*\}/);
                
                if (jsonArrayMatch) {
                    const commands = JSON.parse(jsonArrayMatch[0]);
                    if (Array.isArray(commands)) {
                        for (const command of commands) {
                            await this.executeCommand(command);
                        }
                    } else {
                        await this.executeCommand(commands);
                    }
                    jsonCommandsExecuted = true;
                    
                    // Remove the JSON from the displayable response
                    displayableResponse = displayableResponse.replace(jsonArrayMatch[0], '').trim();
                    
                } else if (jsonObjectMatch) {
                    const command = JSON.parse(jsonObjectMatch[0]);
                    await this.executeCommand(command);
                    jsonCommandsExecuted = true;
                    
                    // Remove the JSON from the displayable response
                    displayableResponse = displayableResponse.replace(jsonObjectMatch[0], '').trim();
                }
            } catch (parseError) {
                // Not a JSON command, just display the response as-is
                console.log('Response is not a command, displaying as text');
            }
            
            // Only add AI response if there's displayable content after removing JSON
            if (displayableResponse && displayableResponse.length > 0) {
                this.addMessage(displayableResponse, 'ai');
            } else if (jsonCommandsExecuted) {
                // If commands were executed but no displayable text, show a friendly confirmation
                this.addMessage('Done! I\'ve updated your playlist as requested.', 'ai');
            } else {
                // Fallback - show the original response if no commands were found
                this.addMessage(response.response, 'ai');
            }
            
        } catch (error) {
            console.error('Chat Error:', error);
            this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'ai');
            Utils.showToast('error', 'Failed to send message to AI assistant');
        } finally {
            // Reset button state
            elements.chatBtn.disabled = false;
            elements.chatBtn.innerHTML = '<i class="bi bi-send"></i>';
        }
    }
    
    static async executeCommand(command) {
        console.log('Executing AI Command:', command);
        
        try {
            switch (command.action) {
                case 'add':
                    await this.executeAddCommand(command);
                    break;
                    
                case 'search_and_add':
                    await this.executeSearchAndAddCommand(command);
                    break;
                    
                case 'remove':
                    this.executeRemoveCommand(command);
                    break;
                    
                case 'move':
                    this.executeMoveCommand(command);
                    break;
                    
                case 'replace':
                    await this.executeReplaceCommand(command);
                    break;
                    
                default:
                    Utils.showToast('warning', `Unknown command action: ${command.action}`);
            }
        } catch (error) {
            console.error('Error executing command:', error);
            Utils.showToast('error', 'Failed to execute AI command');
        }
    }
    
    static async executeAddCommand(command) {
        const { albumName, count = 1 } = command;
        
        if (!albumName) {
            Utils.showToast('error', 'Album name is required for add command');
            return;
        }
        
        try {
            // Get songs from the specified album
            const albumSongs = await ApiService.getSongsByAlbum(albumName);
            
            if (!albumSongs || albumSongs.length === 0) {
                Utils.showToast('warning', `No songs found in album: ${albumName}`);
                return;
            }
            
            // Filter out songs that are already in the playlist
            const availableSongs = albumSongs.filter(song => 
                !AppState.currentPlaylist.some(existingSong => existingSong.id === song.id)
            );
            
            if (availableSongs.length === 0) {
                Utils.showToast('warning', `All songs from ${albumName} are already in the playlist`);
                return;
            }
            
            // Select random songs from the available songs
            const songsToAdd = [];
            const usedIndices = new Set();
            
            for (let i = 0; i < Math.min(count, availableSongs.length); i++) {
                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * availableSongs.length);
                } while (usedIndices.has(randomIndex) && usedIndices.size < availableSongs.length);
                
                usedIndices.add(randomIndex);
                songsToAdd.push(availableSongs[randomIndex]);
            }
            
            // Normalize album name and find correct position based on album hierarchy
            const normalizedAlbumName = PlaylistOrder.normalizeAlbumName(albumName);
            console.log('Adding songs:', { original: albumName, normalized: normalizedAlbumName });
            const correctPosition = PlaylistOrder.findCorrectPosition(AppState.currentPlaylist, normalizedAlbumName);
            
            // Add songs to playlist at correct position
            for (let i = 0; i < songsToAdd.length; i++) {
                AppState.currentPlaylist.splice(correctPosition + i, 0, songsToAdd[i]);
            }
            
            // Sort playlist to maintain proper order
            AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
            
            // Update the display
            PlaylistManager.renderPlaylist(AppState.currentPlaylist);
            
            const songNames = songsToAdd.map(song => song.title).join(', ');
            Utils.showToast('success', `Added ${songsToAdd.length} song(s) from ${normalizedAlbumName}: ${songNames}`);
            
        } catch (error) {
            console.error('Error adding songs:', error);
            Utils.showToast('error', `Failed to add songs from ${albumName}`);
        }
    }
    
    static async executeSearchAndAddCommand(command) {
        const { songTitle, albumHint } = command;
        
        if (!songTitle) {
            Utils.showToast('error', 'Song title is required for search command');
            return;
        }
        
        try {
            // Search for the specific song
            const searchResults = await ApiService.searchSongs(songTitle, {
                albumFilter: albumHint || null,
                minScore: 50, // Higher threshold for specific song searches
                maxResults: 5
            });
            
            if (!searchResults || searchResults.length === 0) {
                Utils.showToast('warning', `No songs found matching "${songTitle}"${albumHint ? ` from ${albumHint}` : ''}`);
                return;
            }
            
            // Find the best match that's not already in the playlist
            let songToAdd = null;
            for (const result of searchResults) {
                if (!AppState.currentPlaylist.some(existingSong => existingSong.id === result.id)) {
                    songToAdd = result;
                    break;
                }
            }
            
            if (!songToAdd) {
                Utils.showToast('warning', `Found "${searchResults[0].title}" but it's already in the playlist`);
                return;
            }
            
            // Find correct position based on album hierarchy
            const correctPosition = PlaylistOrder.findCorrectPosition(AppState.currentPlaylist, songToAdd.album);
            
            // Add song to playlist at correct position
            AppState.currentPlaylist.splice(correctPosition, 0, songToAdd);
            
            // Sort playlist to maintain proper order
            AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
            
            // Update the display
            PlaylistManager.renderPlaylist(AppState.currentPlaylist);
            
            Utils.showToast('success', `Added "${songToAdd.title}" from ${songToAdd.album}`);
            
        } catch (error) {
            console.error('Error searching and adding song:', error);
            Utils.showToast('error', `Failed to search for song "${songTitle}"`);
        }
    }
    
    static executeRemoveCommand(command) {
        const { songId, position } = command;
        
        if (songId) {
            // Remove by song ID
            const index = AppState.currentPlaylist.findIndex(song => song.id === songId);
            if (index !== -1) {
                const removedSong = AppState.currentPlaylist.splice(index, 1)[0];
                PlaylistManager.renderPlaylist(AppState.currentPlaylist);
                Utils.showToast('success', `Removed: ${removedSong.title}`);
            } else {
                Utils.showToast('warning', 'Song not found in playlist');
            }
        } else if (position) {
            // Remove by position
            const index = position - 1;
            if (index >= 0 && index < AppState.currentPlaylist.length) {
                const removedSong = AppState.currentPlaylist.splice(index, 1)[0];
                PlaylistManager.renderPlaylist(AppState.currentPlaylist);
                Utils.showToast('success', `Removed: ${removedSong.title}`);
            } else {
                Utils.showToast('warning', 'Invalid position specified');
            }
        } else {
            Utils.showToast('error', 'Song ID or position is required for remove command');
        }
    }
    
    static executeMoveCommand(command) {
        const { songId, position, newPosition } = command;
        
        let sourceIndex = -1;
        
        if (songId) {
            sourceIndex = AppState.currentPlaylist.findIndex(song => song.id === songId);
        } else if (position) {
            sourceIndex = position - 1;
        }
        
        if (sourceIndex === -1 || sourceIndex >= AppState.currentPlaylist.length) {
            Utils.showToast('warning', 'Song not found in playlist');
            return;
        }
        
        // Get the song to move
        const songToMove = AppState.currentPlaylist[sourceIndex];
        
        // Remove song from current position
        AppState.currentPlaylist.splice(sourceIndex, 1);
        
        // Find correct position based on album hierarchy (ignore requested position)
        const correctPosition = PlaylistOrder.findCorrectPosition(AppState.currentPlaylist, songToMove.album);
        
        // Insert at correct position
        AppState.currentPlaylist.splice(correctPosition, 0, songToMove);
        
        // Sort playlist to maintain proper order
        AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
        
        PlaylistManager.renderPlaylist(AppState.currentPlaylist);
        Utils.showToast('success', `Moved: ${songToMove.title} (positioned according to album hierarchy)`);
    }
    
    static async executeReplaceCommand(command) {
        const { songId, position, newAlbumName } = command;
        
        let targetIndex = -1;
        
        if (songId) {
            targetIndex = AppState.currentPlaylist.findIndex(song => song.id === songId);
        } else if (position) {
            targetIndex = position - 1;
        }
        
        if (targetIndex === -1 || targetIndex >= AppState.currentPlaylist.length) {
            Utils.showToast('warning', 'Song not found in playlist');
            return;
        }
        
        if (!newAlbumName) {
            Utils.showToast('error', 'New album name is required for replace command');
            return;
        }
        
        try {
            const albumSongs = await ApiService.getSongsByAlbum(newAlbumName);
            
            if (!albumSongs || albumSongs.length === 0) {
                Utils.showToast('warning', `No songs found in album: ${newAlbumName}`);
                return;
            }
            
            const randomSong = albumSongs[Math.floor(Math.random() * albumSongs.length)];
            const oldSong = AppState.currentPlaylist[targetIndex];
            
            // Remove old song
            AppState.currentPlaylist.splice(targetIndex, 1);
            
            // Find correct position for new song based on its album
            const correctPosition = PlaylistOrder.findCorrectPosition(AppState.currentPlaylist, randomSong.album);
            
            // Add new song at correct position
            AppState.currentPlaylist.splice(correctPosition, 0, randomSong);
            
            // Sort playlist to maintain proper order
            AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
            
            PlaylistManager.renderPlaylist(AppState.currentPlaylist);
            Utils.showToast('success', `Replaced "${oldSong.title}" with "${randomSong.title}" from ${newAlbumName}. Song repositioned according to 13-step sequence.`);
            
        } catch (error) {
            console.error('Error replacing song:', error);
            Utils.showToast('error', `Failed to replace song with one from ${newAlbumName}`);
        }
    }
}

// Event Handlers
// Prarthanai Manager
class PrarthanaiManager {
    static init() {
        if (typeof prarthanaisData === 'undefined') {
            console.error('Prarthanais data not loaded');
            return;
        }
        
        this.renderPrarthanaiButtons();
    }
    
    static renderPrarthanaiButtons() {
        const container = elements.prarthanaiContainer;
        container.innerHTML = '';
        
        prarthanaisData.verses.forEach(verse => {
            const firstWords = this.getFirstWords(verse.text, 3);
            const button = document.createElement('button');
            button.className = 'btn btn-outline-primary btn-sm';
            button.dataset.verseId = verse.id;
            button.innerHTML = `${firstWords}...`;
            button.title = verse.text; // Full text on hover
            
            button.addEventListener('click', () => this.selectPrarthanai(verse));
            container.appendChild(button);
        });
    }
    
    static getFirstWords(text, count) {
        return text.split(' ').slice(0, count).join(' ');
    }
    
    static selectPrarthanai(verse) {
    // Update application state
    AppState.selectedPrarthanai = verse;
    
    // Update button states
    elements.prarthanaiContainer.querySelectorAll('.btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    const selectedBtn = elements.prarthanaiContainer.querySelector(`[data-verse-id="${verse.id}"]`);
    selectedBtn.classList.remove('btn-outline-primary');
    selectedBtn.classList.add('btn-primary');
    
    // Show selected prayer
    elements.selectedPrarthanaiText.textContent = verse.text;
    elements.selectedPrarthanaiDisplay.classList.remove('d-none');
    
    // Auto-collapse the selector
    this.collapseSelector('prarthanai');
}

static collapseSelector(selectorType) {
    const collapseElement = elements[`${selectorType}Collapse`];
    const toggleButton = elements[`${selectorType}Toggle`];
    
    if (collapseElement && collapseElement.classList.contains('show')) {
        // Use Bootstrap's collapse functionality
        const bsCollapse = new bootstrap.Collapse(collapseElement, {
            toggle: false
        });
        bsCollapse.hide();
        
        // Update toggle button icon
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.classList.remove('bi-chevron-up');
                icon.classList.add('bi-chevron-down');
            }
        }
    }
}

}

// Function Manager
class FunctionManager {
    static init() {
        if (typeof functionsData === 'undefined') {
            console.error('Functions data not loaded');
            return;
        }
        
        this.renderFunctionCards();
    }
    
    static renderFunctionCards() {
        const container = elements.functionContainer;
        container.innerHTML = '';
        
        functionsData.functions.forEach(func => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'col-12';
            
            cardDiv.innerHTML = `
                <div class="card function-card cursor-pointer" data-function-id="${func.id}">
                    <div class="card-body py-2 px-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-calendar-event me-2 text-primary"></i>
                            <span class="fw-bold">${func.name}</span>
                        </div>
                    </div>
                </div>
            `;
            
            const card = cardDiv.querySelector('.function-card');
            card.addEventListener('click', () => this.selectFunction(func));
            
            container.appendChild(cardDiv);
        });
    }
    
    static selectFunction(func) {
        // Update application state
        AppState.selectedFunction = func;
        
        // Update card states
        elements.functionContainer.querySelectorAll('.function-card').forEach(card => {
            card.classList.remove('border-primary', 'bg-primary', 'text-white');
        });
        
        const selectedCard = elements.functionContainer.querySelector(`[data-function-id="${func.id}"]`);
        selectedCard.classList.add('border-primary', 'bg-primary', 'text-white');
        
        // Show selected function
        elements.selectedFunctionText.textContent = func.name;
        elements.selectedFunctionDisplay.classList.remove('d-none');
        
        // Auto-collapse the selector
        this.collapseSelector('function');
    }

    static collapseSelector(selectorType) {
        const collapseElement = elements[`${selectorType}Collapse`];
        const toggleButton = elements[`${selectorType}Toggle`];
        
        if (collapseElement && collapseElement.classList.contains('show')) {
            // Use Bootstrap's collapse functionality
            const bsCollapse = new bootstrap.Collapse(collapseElement, {
                toggle: false
            });
            bsCollapse.hide();
            
            // Update toggle button icon
            if (toggleButton) {
                const icon = toggleButton.querySelector('i');
                if (icon) {
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            }
        }
    }
}

// Member Manager
class MemberManager {
    static init() {
        if (typeof membersData === 'undefined') {
            console.error('Members data not loaded');
            return;
        }
        
        this.renderMemberCards();
    }
    
    static renderMemberCards() {
        const container = elements.memberContainer;
        container.innerHTML = '';
        
        membersData.members.forEach(member => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'col-12';
            
            cardDiv.innerHTML = `
                <div class="card member-card cursor-pointer" data-member-id="${member.id}">
                    <div class="card-body py-2 px-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-person me-2 text-info"></i>
                            <div class="flex-grow-1">
                                <div class="fw-bold">${member.name}</div>
                                <div class="text-muted small">${member.address}</div>
                                <div class="text-muted small">${member.phone_numbers.join(', ')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const card = cardDiv.querySelector('.member-card');
            card.addEventListener('click', () => this.selectMember(member));
            
            container.appendChild(cardDiv);
        });
    }
    
    static selectMember(member) {
        // Update application state
        AppState.selectedMember = member;
        
        // Update card states
        elements.memberContainer.querySelectorAll('.member-card').forEach(card => {
            card.classList.remove('border-info', 'bg-info', 'text-white');
        });
        
        const selectedCard = elements.memberContainer.querySelector(`[data-member-id="${member.id}"]`);
        selectedCard.classList.add('border-info', 'bg-info', 'text-white');
        
        // Show selected member details
        elements.selectedMemberName.textContent = member.name;
        elements.selectedMemberAddress.textContent = member.address;
        elements.selectedMemberPhone.textContent = `Phone: ${member.phone_numbers.join(', ')}`;
        elements.selectedMemberDisplay.classList.remove('d-none');
        
        // Auto-collapse the bhajan details selector (since member is part of bhajan details)
        this.collapseSelector('bhajan');
    }

    static collapseSelector(selectorType) {
        const collapseElement = elements[`${selectorType}Collapse`];
        const toggleButton = elements[`${selectorType}Toggle`];
        
        if (collapseElement && collapseElement.classList.contains('show')) {
            // Use Bootstrap's collapse functionality
            const bsCollapse = new bootstrap.Collapse(collapseElement, {
                toggle: false
            });
            bsCollapse.hide();
            
            // Update toggle button icon
            if (toggleButton) {
                const icon = toggleButton.querySelector('i');
                if (icon) {
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            }
        }
    }

}

// Bhajan Details Manager
class BhajanDetailsManager {
    static init() {
        this.setupEventListeners();
        this.setupDateTimeHandlers();
    }
    
    static setupEventListeners() {
        // Add event listeners for toggle buttons
        const toggleButtons = ['prarthanaiToggle', 'functionToggle', 'bhajanToggle'];
        
        toggleButtons.forEach(toggleId => {
            const button = elements[toggleId];
            if (button) {
                button.addEventListener('click', (e) => {
                    const icon = e.target.querySelector('i') || e.target.closest('button').querySelector('i');
                    if (icon) {
                        // Toggle icon based on collapse state
                        setTimeout(() => {
                            const targetId = button.getAttribute('data-bs-target');
                            const targetElement = document.querySelector(targetId);
                            if (targetElement && targetElement.classList.contains('show')) {
                                icon.classList.remove('bi-chevron-down');
                                icon.classList.add('bi-chevron-up');
                            } else {
                                icon.classList.remove('bi-chevron-up');
                                icon.classList.add('bi-chevron-down');
                            }
                        }, 350); // Wait for Bootstrap animation
                    }
                });
            }
        });
    }
    
    static setupDateTimeHandlers() {
        // Auto-populate day when date is selected
        elements.bhajanDate.addEventListener('change', () => {
            const date = new Date(elements.bhajanDate.value);
            if (!isNaN(date.getTime())) {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                elements.bhajanDay.value = days[date.getDay()];
                
                // Update application state
                AppState.bhajanDetails.date = elements.bhajanDate.value;
                AppState.bhajanDetails.day = elements.bhajanDay.value;
            }
        });
        
        // Update start and end time in application state
        elements.bhajanStartTime.addEventListener('change', () => {
            AppState.bhajanDetails.startTime = elements.bhajanStartTime.value;
        });
        
        elements.bhajanEndTime.addEventListener('change', () => {
            AppState.bhajanDetails.endTime = elements.bhajanEndTime.value;
        });
    }
}

class EventHandlers {
    static setupEventListeners() {
        // Playlist generation form
        elements.playlistForm.addEventListener('submit', this.handlePlaylistGeneration);
        
        // Chat functionality
        elements.chatBtn.addEventListener('click', this.handleChatSend);
        elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleChatSend();
            }
        });
        
        // Action buttons
        elements.exportPdfBtn.addEventListener('click', this.handlePdfExport);
        elements.clearPlaylistBtn.addEventListener('click', this.handleClearPlaylist);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        // Alankaaram checkbox functionality (event delegation)
        document.addEventListener('change', this.handleAlankaaramCheckbox);
        document.addEventListener('input', this.handleAlankaaramTimeChange);
    }
    
    static async handlePlaylistGeneration(e) {
        e.preventDefault();
        
        if (AppState.isGenerating) return;
        
        const duration = parseInt(elements.durationInput.value);
        
        if (!duration || duration < 10 || duration > 300) {
            Utils.showToast('error', 'Please enter a duration between 10 and 300 minutes');
            return;
        }
        
        AppState.isGenerating = true;
        
        // Show loading state
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Generating...';
        
        const loadingModal = Utils.showModal(elements.loadingModal);
        
        // Safety timeout to ensure modal is hidden (45 seconds)
        const safetyTimeout = setTimeout(() => {
            console.warn('Force closing modal due to timeout');
            
            // Use enhanced force close method
            Utils.forceCloseModal();
            
            AppState.isGenerating = false;
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Playlist';
            Utils.showToast('error', 'Request timed out. Please try again.');
        }, 45000);
        
        try {
            // Collect header data from AppState
            const headerData = {
                selectedPrarthanai: AppState.selectedPrarthanai,
                selectedFunction: AppState.selectedFunction,
                selectedMember: AppState.selectedMember,
                bhajanDetails: AppState.bhajanDetails
            };
            
            console.log('Collected header data for playlist generation:', headerData);
            
            const response = await ApiService.generatePlaylist(duration, headerData);
            
            if (response.playlist && response.playlist.length > 0) {
                // Close modal immediately on success with debugging
                console.log('Success: Attempting to close modal');
                console.log('Modal state before close:', elements.loadingModal.classList.contains('show'));
                
                // Clear timeout and close modal properly
                clearTimeout(safetyTimeout);
                
                // Try to use the same modal instance first
                if (loadingModal) {
                    console.log('Closing using stored modal instance');
                    loadingModal.hide();
                    
                    // Fallback if instance doesn't close properly
                    setTimeout(() => {
                        if (elements.loadingModal.classList.contains('show')) {
                            console.log('Instance hide failed, using force close');
                            Utils.forceCloseModal();
                        }
                    }, 300);
                } else {
                    console.log('No stored instance, using force close');
                    Utils.forceCloseModal();
                }
                
                // Store header data for PDF generation and display
                AppState.playlistHeaderData = response.headerData;
                
                PlaylistManager.renderPlaylist(response.playlist);
                Utils.showToast('success', `Playlist generated with ${response.playlist.length} songs!`);
                
                // Verify modal is closed after a short delay
                setTimeout(() => {
                    console.log('Modal state after close attempt:', elements.loadingModal.classList.contains('show'));
                }, 500);
            } else {
                throw new Error('No playlist data received');
            }
            
        } catch (error) {
            console.error('Playlist Generation Error:', error);
            Utils.showToast('error', 'Failed to generate playlist. Please check your connection and try again.');
            PlaylistManager.showEmptyState();
        } finally {
            // Clear the safety timeout (if not already cleared)
            clearTimeout(safetyTimeout);
            
            // Reset UI state
            AppState.isGenerating = false;
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Playlist';
            
            // Ensure modal is hidden (fallback in case it wasn't closed on success)
            if (elements.loadingModal.classList.contains('show')) {
                console.log('Modal still open, closing in finally block');
                Utils.forceCloseModal();
            }
            
            // Double-check that the loading modal is actually closed
            setTimeout(() => {
                if (elements.loadingModal.classList.contains('show')) {
                    console.warn('Modal still visible after close attempt, forcing close');
                    Utils.hideModal(loadingModal); // Pass the stored instance for cleanup
                }
            }, 100);
        }
    }
    
    static handleChatSend() {
        const message = elements.chatInput.value.trim();
        if (message) {
            ChatManager.sendMessage(message);
        }
    }
    
    static async handlePdfExport() {
        if (AppState.currentPlaylist.length === 0) {
            Utils.showToast('error', 'No playlist to export');
            return;
        }
        
        await PdfService.exportPlaylist(AppState.currentPlaylist);
    }
    
    static handleClearPlaylist() {
        if (AppState.currentPlaylist.length === 0) return;
        
        if (confirm('Are you sure you want to clear the current playlist?')) {
            PlaylistManager.clearPlaylist();
        }
    }

    
    static handleKeyboardShortcuts(e) {
        // Ctrl+Enter to generate playlist
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!AppState.isGenerating) {
                elements.playlistForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl+P to export PDF
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            this.handlePdfExport();
        }
        
        // Ctrl+Shift+C to clear playlist
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            this.handleClearPlaylist();
        }
    }
    
    static handleBeforeUnload(e) {
        if (AppState.isGenerating) {
            e.preventDefault();
            e.returnValue = 'Playlist generation is in progress. Are you sure you want to leave?';
        }
    }

    static handleAlankaaramCheckbox(e) {
        if (e.target.classList.contains('alankaaram-checkbox')) {
            const songIndex = parseInt(e.target.dataset.songIndex);
            const timeContainer = e.target.closest('.alankaaram-container').querySelector('.alankaaram-time-container');
            
            if (e.target.checked) {
                timeContainer.classList.remove('d-none');
                // Initialize Alankaaram data if not exists
                if (!AppState.alankaaramData) {
                    AppState.alankaaramData = {};
                }
                AppState.alankaaramData[songIndex] = {
                    enabled: true,
                    minutes: 4
                };
            } else {
                timeContainer.classList.add('d-none');
                if (AppState.alankaaramData && AppState.alankaaramData[songIndex]) {
                    AppState.alankaaramData[songIndex].enabled = false;
                }
            }
        }
    }

    static handleAlankaaramTimeChange(e) {
        if (e.target.classList.contains('alankaaram-time')) {
            const songIndex = parseInt(e.target.dataset.songIndex);
            const minutes = parseInt(e.target.value) || 4;
            
            if (!AppState.alankaaramData) {
                AppState.alankaaramData = {};
            }
            if (!AppState.alankaaramData[songIndex]) {
                AppState.alankaaramData[songIndex] = { enabled: true };
            }
            AppState.alankaaramData[songIndex].minutes = minutes;
        }
    }
}

// Application Initialization
class App {
    static async init() {
        console.log('Initializing Thirupugazh Song List Generator...');
        
        try {
            // Setup event listeners
            EventHandlers.setupEventListeners();
            
            // Initialize new sections
            PrarthanaiManager.init();
            FunctionManager.init();
            MemberManager.init();
            BhajanDetailsManager.init();
            
            // Initialize UI state
            PlaylistManager.showEmptyState();
            
            // Start time updates


            
            // Check initial connection status
            await ApiService.checkHealth();
            
            // Check connection periodically
            setInterval(() => ApiService.checkHealth(), 30000);
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Application initialization error:', error);
            Utils.showToast('error', 'Failed to initialize application');
        }
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for testing or external use
window.ThirupugazhApp = {
    AppState,
    ApiService,
    PlaylistManager,
    ChatManager,
    PdfService,
    Utils
}; 