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
    // Custom 12h time selectors
    startHour: document.getElementById('startHour'),
    startMinute: document.getElementById('startMinute'),
    endHour: document.getElementById('endHour'),
    endMinute: document.getElementById('endMinute'),
    bhajanDuration: document.getElementById('bhajanDuration'),
    bhajanDay: document.getElementById('bhajanDay'),
    startAmPm: document.getElementById('startAmPm'),
    endAmPm: document.getElementById('endAmPm'),
    
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
    
    // Convert 'HH:MM' (24h) to 'h:mm am/pm'
    static to12h(hhmm) {
        if (!hhmm || typeof hhmm !== 'string') return '';
        const [hStr, mStr] = hhmm.split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10) || 0;
        if (isNaN(h)) return '';
        const period = h >= 12 ? 'pm' : 'am';
        h = h % 12; if (h === 0) h = 12;
        return `${h}:${String(m).padStart(2, '0')} ${period}`;
    }
    
    static formatTimeRange12h(start24, end24) {
        const s = Utils.to12h(start24);
        const e = Utils.to12h(end24);
        if (!s && !e) return '';
        if (s && e) return `${s} - ${e}`;
        return s || e;
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
        return this.makeRequest(`/api/search?${params.toString()}`);
    }

    static async checkHealth() {
        try {
            const res = await fetch('/api/health', { cache: 'no-store' });
            // If backend is not present, don't block the app
            return res.ok;
        } catch (e) {
            // Gracefully degrade in standalone mode
            return true;
        }
    }
}

class PdfService {
    static async exportPlaylist(playlist) {
        return this.exportToPdf();
    }

    static async exportToPdf() {
        try {
            if (!window.html2pdf) {
                throw new Error('html2pdf library not loaded');
            }
            
            // Add a style element to ensure Tamil font consistency
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                body, div, span, table, td, th {
                    font-family: 'Noto Sans Tamil', 'Noto Serif Tamil', 'Lohit Tamil', 'Samyak Tamil', 'Tamil MN', 'Tamil Sangam MN', 'Arial Unicode MS', sans-serif;
                }
            `;
            
            const printWrapper = document.createElement('div');
            printWrapper.appendChild(styleEl);
            printWrapper.style.fontFamily = "'Noto Sans Tamil', 'Noto Serif Tamil', 'Lohit Tamil', 'Samyak Tamil', 'Tamil MN', 'Tamil Sangam MN', 'Arial Unicode MS', sans-serif";
            printWrapper.style.padding = '0';
            printWrapper.style.margin = '0';
            printWrapper.style.width = '190mm'; /* keep content inside A4 minus margins */

            // Header panel (centered), like the old PDF
            const hd = AppState.playlistHeaderData || {};
            if (hd && (hd.selectedPrarthanai || hd.selectedFunction || (hd.bhajanDetails && (hd.bhajanDetails.date || hd.bhajanDetails.startTime)))) {
                const panel = document.createElement('div');
                panel.style.border = '0.6px solid #999';
                panel.style.borderRadius = '6px';
                panel.style.background = '#f8f9fa';
                panel.style.padding = '10px 12px';
                panel.style.margin = '0 0 8px 0';
                panel.style.textAlign = 'center';
                panel.style.color = '#111';

                // Invocation inside panel top row
                const invRow = document.createElement('div');
                invRow.style.display = 'flex';
                invRow.style.justifyContent = 'space-between';
                invRow.style.fontWeight = '700';
                invRow.style.marginBottom = '4px';
                const invL = document.createElement('span'); invL.textContent = 'ஓம் ஸ்ரீ மஹாகணபதயே நமஹ';
                const invR = document.createElement('span'); invR.textContent = 'ஓம் ஸ்ரீ குருப்யோ நமஹ';
                invRow.appendChild(invL); invRow.appendChild(invR);
                panel.appendChild(invRow);

                // Prarthanai text (Tamil) if any
                if (hd.selectedPrarthanai && hd.selectedPrarthanai.text) {
                    const prarthanaiDiv = document.createElement('div');
                    prarthanaiDiv.style.marginBottom = '6px';
                    prarthanaiDiv.style.whiteSpace = 'pre-wrap'; // Allow text wrapping but preserve spaces
                    
                    const p = document.createElement('span');
                    p.textContent = hd.selectedPrarthanai.text;
                    // Use exact same styling approach as invocation spans - no custom font styling
                    prarthanaiDiv.appendChild(p);
                    panel.appendChild(prarthanaiDiv);
                }
                // Function name bold
                if (hd.selectedFunction && hd.selectedFunction.name) {
                    const fn = document.createElement('div');
                    fn.textContent = hd.selectedFunction.name;
                    fn.style.fontWeight = '700';
                    fn.style.marginBottom = '4px';
                    panel.appendChild(fn);
                }
                // Date | Day | Time
                if (hd.bhajanDetails) {
                    const segs = [];
                    if (hd.bhajanDetails.date) {
                        const d = new Date(hd.bhajanDetails.date);
                        segs.push(d.toLocaleDateString('en-IN'));
                    }
                    if (hd.bhajanDetails.day) segs.push(hd.bhajanDetails.day);
                    if (hd.bhajanDetails.startTime && hd.bhajanDetails.endTime) {
                        segs.push(Utils.formatTimeRange12h(hd.bhajanDetails.startTime, hd.bhajanDetails.endTime));
                    }
                    if (segs.length) {
                        const line = document.createElement('div');
                        line.textContent = segs.join(' | ');
                        line.style.marginBottom = '6px';
                        panel.appendChild(line);
                    }
                }
                // Host
                if (hd.selectedMember && (hd.selectedMember.name || hd.selectedMember.address || hd.selectedMember.phone || (hd.selectedMember.phone_numbers && hd.selectedMember.phone_numbers.length))) {
                    const host = document.createElement('div');
                    host.style.fontSize = '11px';
                    host.style.color = '#333';
                    const phone = hd.selectedMember.phone || (hd.selectedMember.phone_numbers ? hd.selectedMember.phone_numbers.join(', ') : '');
                    host.innerHTML = `${hd.selectedMember.name || ''}<br>${hd.selectedMember.address || ''}<br>${phone || ''}`;
                    panel.appendChild(host);
                }
                printWrapper.appendChild(panel);
            }

            // Build a clean table that contains only the required columns
            const outTable = document.createElement('table');
            outTable.style.width = '100%';
            outTable.style.borderCollapse = 'collapse';
            outTable.style.fontSize = '11px';
            // Enable header repeat per page
            outTable.style.pageBreakInside = 'auto';
            outTable.style.marginTop = '6px';

            const thead = document.createElement('thead');
            thead.style.display = 'table-header-group';
            const hr = document.createElement('tr');
            // New PDF column set and order
            const headers = ['Sl.No', 'Song Title', 'Raagam', 'Song No', 'Hour', 'A'];
            headers.forEach((h, i) => {
                const th = document.createElement('th');
                th.textContent = h;
                th.style.border = '0.35px solid #000';
                th.style.padding = '4px 6px';
                th.style.textAlign = (i === 1 || i === 2) ? 'left' : 'center';
                // Column widths tuned for A4 with Hour column included
                const widths = ['8%', '50%', '16%', '10%', '10%', '6%'];
                th.style.width = widths[i];
                th.style.whiteSpace = 'nowrap';
                hr.appendChild(th);
            });
            thead.appendChild(hr);
            outTable.appendChild(thead);

            const tbody = document.createElement('tbody');
            tbody.style.display = 'table-row-group';
            const rows = elements.playlistTableBody ? elements.playlistTableBody.querySelectorAll('tr') : [];
            
            // Calculate rows per page based on header content
            let rowsPerPage = 30; // default
            
            // Estimate header lines to adjust rows per page
            let headerLines = 2; // Base: invocation row + minimum spacing
            
            if (hd && hd.selectedPrarthanai && hd.selectedPrarthanai.text) {
                // Estimate lines for prarthanai (assume ~80 chars per line at 11px font)
                const prarthanaiLength = hd.selectedPrarthanai.text.length;
                headerLines += Math.ceil(prarthanaiLength / 80);
            }
            
            if (hd && hd.selectedFunction && hd.selectedFunction.name) {
                headerLines += 1; // Function name
            }
            
            if (hd && hd.bhajanDetails && (hd.bhajanDetails.date || hd.bhajanDetails.startTime)) {
                headerLines += 1; // Date/time line
            }
            
            if (hd && hd.selectedMember && (hd.selectedMember.name || hd.selectedMember.address)) {
                headerLines += 1; // Member name
                if (hd.selectedMember.address) {
                    // Estimate address lines (assume ~60 chars per line for smaller font)
                    const addressLength = hd.selectedMember.address.length;
                    headerLines += Math.ceil(addressLength / 60);
                }
                if (hd.selectedMember.phone || (hd.selectedMember.phone_numbers && hd.selectedMember.phone_numbers.length)) {
                    headerLines += 1; // Phone line
                }
            }
            
            // Adjust rows per page based on header size
            // Each header line takes roughly the space of 1 table row
            // First page: reduce by header lines + 2 for safety margin
            // Subsequent pages: can fit more rows (no header box, just table header)
            const firstPageRows = Math.max(15, 32 - headerLines); // Minimum 15 rows, adjust from 32 baseline
            const subsequentPageRows = 35; // More rows on pages without the header box
            
            rows.forEach((tr, idx) => {
                const tds = tr.querySelectorAll('td');
                if (tds.length < 11) return; // ensure row structure present
                
                // Determine if we need a page break
                let needsPageBreak = false;
                if (idx === firstPageRows) {
                    needsPageBreak = true; // First page break
                } else if (idx > firstPageRows && (idx - firstPageRows) % subsequentPageRows === 0) {
                    needsPageBreak = true; // Subsequent page breaks
                }
                
                // Inject a page break + header only before new pages
                if (needsPageBreak && idx > 0) {
                    // Force a page break first
                    const brTr = document.createElement('tr');
                    const brTd = document.createElement('td');
                    brTd.colSpan = 6;
                    brTd.style.padding = '0';
                    brTd.style.border = 'none';
                    brTr.style.pageBreakBefore = 'always';
                    brTr.style.breakBefore = 'page';
                    brTr.appendChild(brTd);
                    tbody.appendChild(brTr);

                    // Then append a header-like row at the top of the new page
                    const hdrRow = document.createElement('tr');
                    const hdrs = ['Sl.No', 'Song Title', 'Raagam', 'Song No', 'Hour', 'A'];
                    hdrs.forEach((txt, i) => {
                        const td = document.createElement('td');
                        td.textContent = txt;
                        td.style.border = '0.35px solid #000';
                        td.style.padding = '4px 6px';
                        td.style.fontWeight = '700';
                        td.style.backgroundColor = '#e9ecef';
                        td.style.textAlign = (i === 1 || i === 2) ? 'left' : 'center';
                        hdrRow.appendChild(td);
                    });
                    tbody.appendChild(hdrRow);
                }
                const row = document.createElement('tr');
                row.style.pageBreakInside = 'avoid';
                row.style.breakInside = 'avoid';
                // Map from on-screen table to export: skip drag/delete columns
                const slno = tds[2]?.textContent.trim() || '';
                const title = tds[3]?.textContent.trim() || '';
                const raagam = tds[5]?.textContent.trim() || '';
                const songNo = tds[4]?.textContent.trim() || '';
                const hour = tds[9]?.textContent.trim() || '';
                const alChk = tr.querySelector('.alankaaram-checkbox');
                const al = alChk && alChk.checked ? '✓' : '';
                [slno, title, raagam, songNo, hour, al].forEach((val, i) => {
                    const td = document.createElement('td');
                    td.textContent = val;
                    td.style.border = '0.35px solid #000';
                    td.style.padding = '4px 6px';
                    td.style.textAlign = (i === 1 || i === 2) ? 'left' : 'center';
                    if (i === 5) { td.style.fontWeight = '700'; td.style.fontSize = '14px'; }
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            outTable.appendChild(tbody);
            printWrapper.appendChild(outTable);

            // Wait a bit to ensure fonts are loaded
            await new Promise(resolve => setTimeout(resolve, 500));

            const fileName = `thirupugazh_playlist_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.pdf`;
            await html2pdf().set({
                margin: [5,5,5,5],
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
                pagebreak: { mode: ['css','legacy'] },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(printWrapper).save();
        } catch (error) {
            console.error('PDF Export Error:', error);
            Utils.showToast('error', 'Failed to export PDF');
        }
    }
}

class PlaylistManager {
    static renderPlaylist(playlist) {
        AppState.currentPlaylist = playlist;
        AppState.alankaaramData = {}; // Clear Alankaaram data for new playlist
        
        if (!playlist || playlist.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        this.updatePlaylistTable(playlist);
        this.updateCumulativeDurations();
        this.updatePlaylistStats(playlist);
        this.enableActions();
        this.renderPlaylistHeader();
        this.setupDragAndDrop();
    }
    
    static updateCumulativeDurations() {
        const rows = elements.playlistTableBody.querySelectorAll('tr');
        let cumulativeSeconds = 0;
        
        rows.forEach((row, index) => {
            const durationCell = row.querySelector('.duration-cell');
            const cumTimeCell = row.querySelector('.cumulative-time');
            const hourCell = row.querySelector('.hour-cell');
            
            if (!durationCell || !cumTimeCell) return;
            
            // Get duration in seconds
            const durationText = durationCell.textContent.trim();
            const [minutes, seconds] = durationText.split(':').map(Number);
            const durationInSeconds = (minutes * 60) + (seconds || 0);
            
            // Add alankaaram time if checked
            const alankaaramCheckbox = row.querySelector('.alankaaram-checkbox');
            const alankaaramTimeInput = row.querySelector('.alankaaram-time');
            
            if (alankaaramCheckbox && alankaaramCheckbox.checked && alankaaramTimeInput) {
                const alankaaramMinutes = parseInt(alankaaramTimeInput.value) || 5;
                cumulativeSeconds += alankaaramMinutes * 60;
            }
            
            // Add song duration
            cumulativeSeconds += durationInSeconds;
            
            // Format cumulative time
            const hours = Math.floor(cumulativeSeconds / 3600);
            const remainingMinutes = Math.floor((cumulativeSeconds % 3600) / 60);
            const remainingSeconds = cumulativeSeconds % 60;
            
            let formattedCumTime = '';
            if (hours > 0) {
                formattedCumTime = `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            } else {
                formattedCumTime = `${remainingMinutes}:${String(remainingSeconds).padStart(2, '0')}`;
            }
            
            // Update cumulative time cell
            if (cumTimeCell) {
                cumTimeCell.textContent = formattedCumTime;
                cumTimeCell.dataset.seconds = cumulativeSeconds;
            }
            
            // Calculate and update hour
            if (hourCell) {
                const hourNumber = Math.ceil(cumulativeSeconds / 3600);
                hourCell.textContent = `${hourNumber}${this.getOrdinalSuffix(hourNumber)} Hr`;
            }
        });
    }
    
    static getOrdinalSuffix(number) {
        const j = number % 10, k = number % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }
    
    static setupDragAndDrop() {
        const tbody = elements.playlistTableBody;
        let draggedRow = null;

        // Make rows draggable
        const makeRowsDraggable = () => {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                row.draggable = true;
                
                // Add drag handle
                if (!row.querySelector('.drag-handle')) {
                    const dragCell = row.cells[0];
                    dragCell.innerHTML = '<i class="bi bi-grip-vertical text-muted drag-handle"></i>';
                    dragCell.style.cursor = 'grab';
                }
                
                row.addEventListener('dragstart', (e) => {
                    draggedRow = row;
                    setTimeout(() => row.classList.add('dragging'), 0);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
                });
                
                row.addEventListener('dragend', () => {
                    row.classList.remove('dragging');
                    draggedRow = null;
                });
            });
        };
        
        // Set up drag over and drop events
        tbody.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(tbody, e.clientY);
            if (afterElement) {
                tbody.insertBefore(draggedRow, afterElement);
            } else {
                tbody.appendChild(draggedRow);
            }
            
            // Update row numbers and cumulative times
            this.updateRowNumbers();
            this.updateCumulativeDurations();
        });
        
        // Initialize draggable rows
        makeRowsDraggable();
    }
    
    static getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    static updateRowNumbers() {
        const rows = elements.playlistTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const numberCell = row.cells[2];
            if (numberCell) {
                numberCell.textContent = index + 1;
            }
        });
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

            // Check if Alankaaram data exists for this song
            const alankaaramData = AppState.alankaaramData[song.id] || {};
            const hasAlankaaram = alankaaramData.enabled !== undefined ? alankaaramData.enabled : false;
            const alankaaramTime = (alankaaramData.time || '5');

            // Format duration as MM:SS supporting 'M.SS' notation in songs.js
            const formattedDuration = Utils.formatDuration(song.duration);

            row.innerHTML = `
                <td class="text-center"></td>
                <td class="text-center"></td>
                <td class="text-center">${index + 1}</td>
                <td>${song.title || ''}</td>
                <td>${song.songNumber || song.songNumber8thEd || ''}</td>
                <td>${song.raga || song.raagam || ''}</td>
                <td>${song.album || ''}</td>
                <td class="text-center duration-cell">${formattedDuration}</td>
                <td class="text-center cumulative-time">00:00</td>
                <td class="text-center hour-cell">1st Hour</td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center">
                        <div class="form-check me-2">
                            <input class="form-check-input alankaaram-checkbox" type="checkbox" 
                                   id="alankaaram-${song.id}" ${hasAlankaaram ? 'checked' : ''}>
                        </div>
                        <div class="input-group input-group-sm alankaaram-time-container" style="width: 80px; ${!hasAlankaaram ? 'display: none;' : ''}">
                            <input type="text" class="form-control form-control-sm text-center alankaaram-time" 
                                   value="${alankaaramTime}" placeholder="5">
                            <span class="input-group-text">min</span>
                        </div>
                    </div>
                </td>
            `;

            // Add drag handle and delete button into their respective cells
            const dragCell = row.cells[0];
            dragCell.innerHTML = '<i class="bi bi-grip-vertical text-muted drag-handle"></i>';
            dragCell.style.cursor = 'grab';

            const deleteCell = row.cells[1];
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-sm btn-link text-danger p-0 delete-song-btn';
            deleteBtn.title = 'Remove';
            deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            deleteBtn.addEventListener('click', () => this.removeSong(song.id));
            deleteCell.appendChild(deleteBtn);

            // Add event listeners for Alankaaram controls
            const checkbox = row.querySelector(`#alankaaram-${song.id}`);
            const timeInput = row.querySelector('.alankaaram-time');
            const timeContainer = row.querySelector('.alankaaram-time-container');

            // Update Alankaaram data when checkbox changes
            checkbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                // Show/Hide time input
                if (timeContainer) timeContainer.style.display = isChecked ? '' : 'none';
                // Default to 5 when enabled
                if (isChecked && timeInput && (!timeInput.value || isNaN(parseInt(timeInput.value)))) {
                    timeInput.value = '5';
                }

                // Update Alankaaram data in state
                AppState.alankaaramData[song.id] = {
                    enabled: isChecked,
                    time: isChecked ? (timeInput.value || '5') : '5'
                };

                // Update cumulative durations and playlist stats
                this.updateCumulativeDurations();
                this.updatePlaylistStats(playlist);
            });

            // Update Alankaaram time when input changes
            timeInput.addEventListener('change', (e) => {
                // Validate time is a number between 1 and 60
                let minutes = parseInt(e.target.value);
                if (isNaN(minutes) || minutes < 1) minutes = 5;
                if (minutes > 60) minutes = 60;
                e.target.value = minutes;

                // Update Alankaaram data in state
                AppState.alankaaramData[song.id] = {
                    enabled: true,
                    time: minutes.toString()
                };

                // Update cumulative durations and playlist stats
                this.updateCumulativeDurations();
                this.updatePlaylistStats(playlist);
            });

            tbody.appendChild(row);
        });
    }

    static updatePlaylistStats(playlist) {
        // Recalculate total including Alankaaram to keep in sync with cumulative
        let totalSeconds = 0;
        const rows = elements.playlistTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const durationCell = row.querySelector('.duration-cell');
            if (!durationCell) return;
            const [mStr, sStr] = durationCell.textContent.trim().split(':');
            const m = parseInt(mStr) || 0;
            const s = parseInt(sStr) || 0;
            totalSeconds += m * 60 + s;
            const alChk = row.querySelector('.alankaaram-checkbox');
            const alTime = row.querySelector('.alankaaram-time');
            if (alChk && alChk.checked) {
                const addMin = parseInt(alTime && alTime.value) || 5;
                totalSeconds += addMin * 60;
            }
        });
        const songCount = playlist.length;
        elements.playlistStats.innerHTML = `${songCount} songs • ${Utils.formatTotalDuration(totalSeconds)}`;
    }

    static enableActions() {
        elements.exportPdfBtn.disabled = false;
        elements.clearPlaylistBtn.disabled = false;
        // Keep chat controls enabled at all times
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
        headerDiv.className = 'card-header bg-info text-white mb-3';
        let headerContent = '';
        // Row 1: Invocation (left/right)
        headerContent += `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="ms-2 fw-bold">ஓம் ஸ்ரீ மஹாகணபதயே நமஹ</span>
                <span class="me-2 fw-bold">ஓம் ஸ்ரீ குருப்யோ நமஹ</span>
            </div>
        `;
        // Centered block: prarthanai, function, date|day|time
        headerContent += `<div class="text-center">`;
        if (headerData.selectedPrarthanai) {
            headerContent += `<div class="mb-1">${headerData.selectedPrarthanai.text}</div>`;
        }
        if (headerData.selectedFunction) {
            headerContent += `<div class="mb-1 fw-bold">${headerData.selectedFunction.name}</div>`;
        }
        if (headerData.bhajanDetails && (headerData.bhajanDetails.date || headerData.bhajanDetails.startTime || headerData.bhajanDetails.endTime)) {
            const parts = [];
            if (headerData.bhajanDetails.date) {
                const d = new Date(headerData.bhajanDetails.date);
                parts.push(d.toLocaleDateString('en-IN'));
            }
            if (headerData.bhajanDetails.day) parts.push(headerData.bhajanDetails.day);
            if (headerData.bhajanDetails.startTime && headerData.bhajanDetails.endTime) {
                parts.push(Utils.formatTimeRange12h(headerData.bhajanDetails.startTime, headerData.bhajanDetails.endTime));
            }
            if (parts.length) headerContent += `<div class="mb-1">${parts.join(' | ')}</div>`;
        }
        headerContent += `</div>`;
        // Host details centered under the block
        if (headerData.selectedMember) {
            const phone = headerData.selectedMember.phone || (headerData.selectedMember.phone_numbers ? headerData.selectedMember.phone_numbers.join(', ') : '');
            headerContent += `
                <div class="mt-2 small text-center">
                    <div>${headerData.selectedMember.name || ''}</div>
                    <div class="text-white-50">${headerData.selectedMember.address || ''}</div>
                    <div class="text-white-50">${phone}</div>
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
        // Do not disable chat controls
    }
    
    static clearPlaylist() {
        AppState.currentPlaylist = [];
        AppState.alankaaramData = {}; // Clear Alankaaram data
        this.showEmptyState();
        Utils.showToast('success', 'Playlist cleared successfully!');
    }

    static removeSong(songId) {
        const index = AppState.currentPlaylist.findIndex(song => song.id === songId);
        if (index !== -1) {
            const removedSong = AppState.currentPlaylist.splice(index, 1)[0];
            this.renderPlaylist(AppState.currentPlaylist);
            Utils.showToast('success', `Removed: ${removedSong.title}`);
            
            // Auto-save after deletion
            PlaylistStorage.debouncedAutoSave();
        } else {
            Utils.showToast('warning', 'Song not found in playlist');
        }
    }

    

}

// Album Order Hierarchy - Following 13-step sequence from SRS
class PlaylistOrder {
    static albumHierarchy = [
        'விநாயகர் துதி',
        'விநாயகர் நாமாவளி',
        'குரு வணக்கம்',
        'திருப்பரங்குன்றம்',
        'திருசெந்தூர்',
        'திருப்பழனி',
        'ஸ்வாமி மலை',
        'திருத்தணிகை',
        'ஆறு திருப்பதி',
        'ரத்னகிரி',
        'ஊதிமலை',
        'கதிர்காமம்',
        'கரகமலை',
        'கயிலைமலை',
        'ரசதகிரி',
        'குன்றுதோறாடல்',
        'கொங்கணகிரி',
        'கொல்லிமலை',
        'ஞானமலை',
        'திருக்கழுக்குன்றம்',
        'திருக்கோணமலை',
        'திருச்சிராப்பள்ளி',
        'திருச்செங்கோடு',
        'ஸ்ரீசைலம்',
        'திருவேங்கடம்',
        'தீர்த்தமலை',
        'வள்ளிமலை',
        'வள்ளியூர்',
        'விநாயகமலை ( பிள்ளையார்பட்டி )',
        'விராலிமலை',
        'அத்திப்பட்டு',
        'அவிநாசி',
        'ஆய்க்குடி',
        'இராமேஸ்வரம்',
        'உத்தரமேரூர்',
        'எட்டுகுடி',
        'எண்கண்',
        'எழுகரைநாடு',
        'கந்தனூர்',
        'கந்தன்குடி',
        'கருவூர்',
        'காசி',
        'கும்பகோணம்',
        'கூந்தலூர்',
        'கோடிநகர் ( குழகர் கோயில் )',
        'சிக்கல்',
        'சிவபுரம்',
        'சிறுவை',
        'சீகாழி',
        'சேலம்',
        'சோமநாதன் மடம்',
        'சோமீஸ்வரம்',
        'திருக்கடவூர்',
        'திருக்குடவாயில்',
        'திருகுரங்காடுதுறை',
        'திருக்குற்றாலம்',
        'திருச்செங்காட்டங்குடி',
        'திருநள்ளாறு',
        'திருநாகேஸ்வரம்',
        'திருநெல்வாயில்',
        'திருப்பந்தணை நல்லூர்',
        'திருப்பாதிரிப்புலியூர்',
        'திருப்புக்கொளியூர்',
        'திருப்பெருந்துரை',
        'திருப்போரூர்',
        'திருமயிலை',
        'திருமாந்துரை',
        'திருமுருகன்பூண்டி',
        'திருவக்கரை',
        'திருவலிதாயம்',
        'திருவாஞ்சியம்',
        'திருவாடானை',
        'திருவாரூர்',
        'திருவான்மியூர்',
        'திருவிடைக்கழி',
        'திருவீழிமிழலை',
        'திருவெஞ்சமாகூடல்',
        'திருவேட்களம்',
        'திருவேற்காடு',
        'திருவொற்றியூர்',
        'திருவோத்தூர்',
        'திலதைப்பதி',
        'தேவனூர்',
        'நாகபட்டினம்',
        'நிம்பபுரம்',
        'பாகை',
        'புனவாயில்',
        'பெருங்குடி',
        'பேரூர்',
        'மதுராந்தகம்',
        'மதுரை',
        'மாயாபுரி',
        'வடதிருமுல்லைவாயில்',
        'வடுகூர்',
        'வயலூர்',
        'வயிரவிவனம்',
        'வாலிகொண்டபுரம்',
        'விஜயபுரம்',
        'விரிஞ்சிபுரம்',
        'வ்ருத்தாசலம்',
        'வெள்ளிகரம்',
        'வேதாரண்யம்',
        'வேப்பூர்',
        'வைத்தீஸ்வரன் கோயில்',
        'ஸ்ரீமுஷ்டம்',
        'க்ஷேத்ரகோவை',
        'பொதுப் பாடல்கள்',
        'பஞ்சபூதம் காஞ்சீபுரம்',
        'பஞ்சபூதம் திரு ஆனைகாவல்',
        'பஞ்சபூதம் திரு அருணை',
        'பஞ்சபூதம் திருக் காளஹஸ்தி',
        'பஞ்சபூதம் திரு சிதம்பரம்',
        'பழமுதிர் சோலை',
        'கந்தர் அனுபூதி',
        'வே, ம, சே',
        'விரு',
        'மகுடம்',
        'வகுப்பு',
        'பூஜோபசாரங்கள்',
        'ஏறுமயில்',
        'ப்ரார்த்தனை'
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

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            const songNumberA = this.parseSongNumber(a.songNumber);
            const songNumberB = this.parseSongNumber(b.songNumber);

            return songNumberA - songNumberB;
        });
    }

    static parseSongNumber(songNumber) {
        if (!songNumber) return 0;
        const match = songNumber.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
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
                case 'remove_from_album':
                    this.executeRemoveFromAlbumCommand(command);
                    break;
                default:
                    Utils.showToast('warning', `Unknown command action: ${command.action}`);
            }
        } catch (error) {
            console.error('Error executing command:', error);
            Utils.showToast('error', 'Failed to execute AI command');
        }
    }

    static executeRemoveFromAlbumCommand(command) {
        const { albumName, count = 1 } = command;

        if (!albumName) {
            Utils.showToast('error', 'Album name is required for remove_from_album command');
            return;
        }

        const normalizedAlbumName = PlaylistOrder.normalizeAlbumName(albumName);
        const songsToRemove = AppState.currentPlaylist.filter(song => song.album === normalizedAlbumName);

        if (songsToRemove.length === 0) {
            Utils.showToast('warning', `No songs from ${normalizedAlbumName} found in the playlist`);
            return;
        }

        const songsActuallyRemoved = [];
        for (let i = 0; i < count && songsToRemove.length > 0; i++) {
            const songToRemove = songsToRemove.pop();
            const index = AppState.currentPlaylist.findIndex(song => song.id === songToRemove.id);
            if (index !== -1) {
                AppState.currentPlaylist.splice(index, 1);
                songsActuallyRemoved.push(songToRemove);
            }
        }

        AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
        PlaylistManager.renderPlaylist(AppState.currentPlaylist);
        const removedSongTitles = songsActuallyRemoved.map(song => song.title).join(', ');
        Utils.showToast('success', `Removed ${songsActuallyRemoved.length} song(s) from ${normalizedAlbumName}: ${removedSongTitles}`);
        
        // Auto-save after modification
        PlaylistStorage.debouncedAutoSave();
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
            
            // Auto-save after modification
            PlaylistStorage.debouncedAutoSave();
            
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
            
            // Auto-save after modification
            PlaylistStorage.debouncedAutoSave();
            
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
                AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
                PlaylistManager.renderPlaylist(AppState.currentPlaylist);
                Utils.showToast('success', `Removed: ${removedSong.title}`);
                PlaylistStorage.debouncedAutoSave();
            } else {
                Utils.showToast('warning', 'Song not found in playlist');
            }
        } else if (position) {
            // Remove by position
            const index = position - 1;
            if (index >= 0 && index < AppState.currentPlaylist.length) {
                const removedSong = AppState.currentPlaylist.splice(index, 1)[0];
                AppState.currentPlaylist = PlaylistOrder.sortPlaylist(AppState.currentPlaylist);
                PlaylistManager.renderPlaylist(AppState.currentPlaylist);
                Utils.showToast('success', `Removed: ${removedSong.title}`);
                PlaylistStorage.debouncedAutoSave();
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
        PlaylistStorage.debouncedAutoSave();
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
            
            // Auto-save after modification
            PlaylistStorage.debouncedAutoSave();
            
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
    
    static updateSelectedDisplay(prarthanai) {
        if (!prarthanai) return;
        
        // Update card states
        elements.prarthanaiContainer.querySelectorAll('.prarthanai-card').forEach(card => {
            card.classList.remove('border-success', 'bg-success', 'text-white');
        });
        
        const selectedCard = elements.prarthanaiContainer.querySelector(`[data-prarthanai-id="${prarthanai.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-success', 'bg-success', 'text-white');
        }
        
        // Show selected prarthanai
        elements.selectedPrarthanaiText.textContent = prarthanai.text;
        elements.selectedPrarthanaiDisplay.classList.remove('d-none');
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
    
    static updateSelectedDisplay(func) {
        if (!func) return;
        
        // Update card states
        elements.functionContainer.querySelectorAll('.function-card').forEach(card => {
            card.classList.remove('border-primary', 'bg-primary', 'text-white');
        });
        
        const selectedCard = elements.functionContainer.querySelector(`[data-function-id="${func.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-primary', 'bg-primary', 'text-white');
        }
        
        // Show selected function
        elements.selectedFunctionText.textContent = func.name;
        elements.selectedFunctionDisplay.classList.remove('d-none');
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
    
    static updateSelectedDisplay(member) {
        if (!member) return;
        
        // Update card states
        elements.memberContainer.querySelectorAll('.member-card').forEach(card => {
            card.classList.remove('border-info', 'bg-info', 'text-white');
        });
        
        const selectedCard = elements.memberContainer.querySelector(`[data-member-id="${member.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-info', 'bg-info', 'text-white');
        }
        
        // Show selected member details
        elements.selectedMemberName.textContent = member.name;
        elements.selectedMemberAddress.textContent = member.address || '';
        elements.selectedMemberPhone.textContent = member.phone ? `Phone: ${member.phone}` : '';
        elements.selectedMemberDisplay.classList.remove('d-none');
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
        // Set default date to today if not set
        if (!elements.bhajanDate.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            elements.bhajanDate.value = `${yyyy}-${mm}-${dd}`;
        }

        // Initialize day field
        this.updateDayField();
        
        // Initialize default start time if empty
        if (elements.startHour && !elements.startHour.value) elements.startHour.value = '08';
        if (elements.startMinute && !elements.startMinute.value) elements.startMinute.value = '00';
        if (elements.startAmPm && !elements.startAmPm.value) elements.startAmPm.value = 'AM';
        // Initialize time display and end time
        this.updateEndTime();
        this.updateTimeDisplay();

        // Auto-populate day when date is selected
        elements.bhajanDate.addEventListener('change', () => this.updateDayField());
        
        // Handle start time change (custom selects)
        const startTimeChange = () => { this.updateEndTime(); this.updateTimeDisplay(); };
        if (elements.startHour) elements.startHour.addEventListener('change', startTimeChange);
        if (elements.startMinute) elements.startMinute.addEventListener('change', startTimeChange);
        if (elements.startAmPm) elements.startAmPm.addEventListener('change', startTimeChange);
        
        // Handle duration change
        elements.bhajanDuration.addEventListener('change', () => {
            this.updateEndTime();
            this.updateTimeDisplay();
            
            // Sync with playlist duration
            if (elements.durationInput) {
                elements.durationInput.value = elements.bhajanDuration.value;
            }
        });
        
        // Sync with playlist duration when it changes
        if (elements.durationInput) {
            elements.durationInput.addEventListener('change', () => {
                elements.bhajanDuration.value = elements.durationInput.value;
                this.updateEndTime();
                this.updateTimeDisplay();
            });
        }

        // Add event delegation for time input icons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.input-group-text')) {
                const input = e.target.closest('.input-group').querySelector('input');
                if (input) {
                    input.focus();
                    input.click();
                }
            }
        });
    }
    
    // New helper method to update day field
    static updateDayField() {
        const date = new Date(elements.bhajanDate.value);
        if (!isNaN(date.getTime())) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[date.getDay()];
            elements.bhajanDay.textContent = dayName;
            
            // Update application state
            AppState.bhajanDetails.date = elements.bhajanDate.value;
            AppState.bhajanDetails.day = dayName;
        }
    }
    
    static updateEndTime() {
        if (!elements.startHour || !elements.startMinute) return;
        const duration = parseInt(elements.bhajanDuration.value) || 60;
        // Convert start selectors + AM/PM to minutes
        let sH = parseInt(elements.startHour.value, 10) || 8;
        const sM = parseInt(elements.startMinute.value, 10) || 0;
        const ampm = elements.startAmPm ? elements.startAmPm.value : 'AM';
        let startH24 = sH % 12;
        if (ampm === 'PM') startH24 += 12;
        const startTotal = startH24 * 60 + sM;
        const endTotal = (startTotal + duration) % (24 * 60);
        const endH24 = Math.floor(endTotal / 60);
        const endM = endTotal % 60;
        const endAmPm = endH24 >= 12 ? 'PM' : 'AM';
        const endH12 = (endH24 % 12) || 12;
        if (elements.endHour) elements.endHour.value = String(endH12).padStart(2, '0');
        if (elements.endMinute) elements.endMinute.value = String(endM).padStart(2, '0');
        if (elements.endAmPm) elements.endAmPm.value = endAmPm;
        // Update application state (store 24h strings)
        AppState.bhajanDetails.startTime = `${String(startH24).padStart(2,'0')}:${String(sM).padStart(2,'0')}`;
        AppState.bhajanDetails.endTime = `${String(endH24).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
        AppState.bhajanDetails.duration = duration;
    }
    
    static updateTimeDisplay() {
        if (!elements.startHour || !elements.endHour) return;
        const to12h = (h24, m) => {
            const period = h24 >= 12 ? 'PM' : 'AM';
            const h12 = (h24 % 12) || 12;
            return `${h12}:${String(m).padStart(2,'0')} ${period}`;
        };
        let sH = parseInt(elements.startHour.value, 10) || 8;
        const sM = parseInt(elements.startMinute.value, 10) || 0;
        let sH24 = sH % 12; if (elements.startAmPm && elements.startAmPm.value === 'PM') sH24 += 12;
        const eH12 = parseInt(elements.endHour.value || '12', 10) || 12;
        const eM = parseInt(elements.endMinute.value || '0', 10) || 0;
        const eH24 = (elements.endAmPm && elements.endAmPm.value === 'PM') ? ((eH12 % 12) + 12) : (eH12 % 12);
        const startStr = to12h(sH24, sM||0);
        const endStr = to12h(eH24, eM||0);
        const label = document.getElementById('timeRangeDisplay');
        if (label) label.textContent = `${startStr} - ${endStr}`;
    }
    
    // Restore bhajan details from saved data
    static restoreBhajanDetails(details) {
        if (!details) return;
        
        // Restore date (extract date part if ISO string)
        if (details.date && elements.bhajanDate) {
            const dateValue = details.date.split('T')[0]; // Extract yyyy-MM-dd from ISO
            elements.bhajanDate.value = dateValue;
            this.updateDayField();
        }
        
        // Restore start time
        if (details.startTime && elements.startHour && elements.startMinute && elements.startAmPm) {
            const [h24Str, mStr] = details.startTime.split(':');
            const h24 = parseInt(h24Str, 10);
            const m = parseInt(mStr, 10);
            const ampm = h24 >= 12 ? 'PM' : 'AM';
            const h12 = (h24 % 12) || 12;
            
            elements.startHour.value = String(h12).padStart(2, '0');
            elements.startMinute.value = String(m).padStart(2, '0');
            elements.startAmPm.value = ampm;
        }
        
        // Restore end time
        if (details.endTime && elements.endHour && elements.endMinute && elements.endAmPm) {
            const [h24Str, mStr] = details.endTime.split(':');
            const h24 = parseInt(h24Str, 10);
            const m = parseInt(mStr, 10);
            const ampm = h24 >= 12 ? 'PM' : 'AM';
            const h12 = (h24 % 12) || 12;
            
            elements.endHour.value = String(h12).padStart(2, '0');
            elements.endMinute.value = String(m).padStart(2, '0');
            elements.endAmPm.value = ampm;
        }
        
        this.updateTimeDisplay();
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

        // Playlist table actions (event delegation)
        if (elements.playlistTableBody) {
            elements.playlistTableBody.addEventListener('click', this.handlePlaylistClick);
        }
    }

    static handlePlaylistClick(e) {
        const deleteBtn = e.target.closest('.delete-song-btn');
        if (!deleteBtn) return;
        e.preventDefault();

        const idx = parseInt(deleteBtn.dataset.songIndex);
        if (Number.isNaN(idx) || idx < 0 || idx >= AppState.currentPlaylist.length) return;

        const [removed] = AppState.currentPlaylist.splice(idx, 1);

        // Re-render playlist (also recalculates indices and stats)
        PlaylistManager.renderPlaylist(AppState.currentPlaylist);

        Utils.showToast('success', `Removed: ${removed?.title || 'Song'}`);
        
        // Auto-save after deletion
        console.log('Delete button clicked - triggering auto-save');
        PlaylistStorage.debouncedAutoSave();
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
                
                // Auto-save the generated playlist
                await PlaylistStorage.autoSave();
                
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
            
            // Auto-save after alankaaram change
            PlaylistStorage.debouncedAutoSave();
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
            
            // Auto-save after time change
            PlaylistStorage.debouncedAutoSave();
        }
    }
}

// Playlist Storage Service - Auto-save/Load functionality
class PlaylistStorage {
    static lastSaveTime = null;
    static saveInProgress = false;
    
    // Auto-save current playlist
    static async autoSave() {
        if (this.saveInProgress) return;
        if (AppState.currentPlaylist.length === 0) return;
        
        try {
            this.saveInProgress = true;
            this.updateSaveStatus('Saving...');
            
            const response = await fetch(`${API_BASE}/api/playlists/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playlist: AppState.currentPlaylist,
                    headerData: AppState.playlistHeaderData,
                    alankaaramData: AppState.alankaaramData
                })
            });
            
            if (!response.ok) throw new Error('Failed to save playlist');
            
            const data = await response.json();
            this.lastSaveTime = new Date(data.lastSaved);
            this.updateSaveStatus(`Saved at ${this.formatSaveTime(this.lastSaveTime)}`);
            
            console.log('Playlist auto-saved successfully');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.updateSaveStatus('Save failed');
        } finally {
            this.saveInProgress = false;
        }
    }
    
    // Load current playlist on page load
    static async loadCurrent() {
        try {
            const response = await fetch(`${API_BASE}/api/playlists/current`);
            if (!response.ok) throw new Error('Failed to load playlist');
            
            const data = await response.json();
            
            if (!data.playlist || data.playlist.length === 0) {
                console.log('No saved playlist found');
                return false;
            }
            
            // Restore playlist
            AppState.currentPlaylist = data.playlist;
            
            // Restore alankaaram data
            AppState.alankaaramData = {};
            data.playlist.forEach(song => {
                if (song.alankaaramEnabled) {
                    AppState.alankaaramData[song.id] = {
                        enabled: song.alankaaramEnabled,
                        time: song.alankaaramTime
                    };
                }
            });
            
            // Restore header data
            if (data.headerData) {
                AppState.playlistHeaderData = data.headerData;
                
                // Restore Prarthanai
                if (data.headerData.selectedPrarthanai) {
                    AppState.selectedPrarthanai = data.headerData.selectedPrarthanai;
                    PrarthanaiManager.updateSelectedDisplay(data.headerData.selectedPrarthanai);
                }
                
                // Restore Function
                if (data.headerData.selectedFunction) {
                    AppState.selectedFunction = data.headerData.selectedFunction;
                    FunctionManager.updateSelectedDisplay(data.headerData.selectedFunction);
                }
                
                // Restore Member
                if (data.headerData.selectedMember) {
                    AppState.selectedMember = data.headerData.selectedMember;
                    MemberManager.updateSelectedDisplay(data.headerData.selectedMember);
                }
                
                // Restore Bhajan Details
                if (data.headerData.bhajanDetails) {
                    AppState.bhajanDetails = data.headerData.bhajanDetails;
                    BhajanDetailsManager.restoreBhajanDetails(data.headerData.bhajanDetails);
                }
            }
            
            // Update UI
            PlaylistManager.renderPlaylist(AppState.currentPlaylist);
            
            // Update save time
            if (data.metadata?.lastSaved) {
                this.lastSaveTime = new Date(data.metadata.lastSaved);
                this.updateSaveStatus(`Saved at ${this.formatSaveTime(this.lastSaveTime)}`);
            }
            
            console.log('Playlist loaded successfully:', data.playlist.length, 'songs');
            Utils.showToast('success', `Loaded playlist with ${data.playlist.length} songs`);
            return true;
        } catch (error) {
            console.error('Failed to load playlist:', error);
            return false;
        }
    }
    
    // Mark current playlist as complete (moves to history)
    static async markComplete() {
        try {
            const response = await fetch(`${API_BASE}/api/playlists/mark-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to mark playlist as complete');
            
            console.log('Playlist marked as complete');
            Utils.showToast('success', 'Playlist completed and moved to history');
        } catch (error) {
            console.error('Failed to mark playlist as complete:', error);
            Utils.showToast('error', 'Failed to complete playlist');
        }
    }
    
    // Update save status UI
    static updateSaveStatus(message) {
        const statusElement = document.getElementById('saveStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.opacity = '1';
            
            // Fade out after 3 seconds if success
            if (message.startsWith('Saved')) {
                setTimeout(() => {
                    statusElement.style.opacity = '0.6';
                }, 3000);
            }
        }
    }
    
    // Format save time nicely
    static formatSaveTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Debounced auto-save (waits 2 seconds after last change)
    static debouncedAutoSave = (() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.autoSave(), 2000);
        };
    })();
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
            
            // Load saved playlist if exists
            const loaded = await PlaylistStorage.loadCurrent();
            if (!loaded) {
                PlaylistManager.showEmptyState();
            }
            
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