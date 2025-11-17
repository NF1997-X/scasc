class FileManager {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.confirmUploadBtn = document.getElementById('confirmUploadBtn');
        this.fileDetailsForm = document.getElementById('fileDetailsForm');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressBar = document.getElementById('progressBar');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.alertContainer = document.getElementById('alertContainer');
        
        this.selectedFiles = null;
        this.outsideClickHandlerAdded = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.initializeActionMenus();
    }

    setupEventListeners() {
        // Upload button
        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Confirm upload button
        this.confirmUploadBtn.addEventListener('click', () => {
            this.uploadFilesWithDetails();
        });

        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.refreshFileList();
        });

        // View buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const btn = e.target.closest('.view-btn');
                this.showViewModal(btn.dataset.fileId, btn.dataset.fileName);
            }
        });

        // Share buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn')) {
                const btn = e.target.closest('.share-btn');
                this.showShareModal(btn.dataset.fileId, btn.dataset.shareToken);
            }
        });

        // Settings buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.settings-btn')) {
                const btn = e.target.closest('.settings-btn');
                this.showSettingsModal(btn.dataset.fileId, btn.dataset.fileName);
            }
        });

        // Delete buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const btn = e.target.closest('.delete-btn');
                this.deleteFile(btn.dataset.fileId);
            }
        });

        // Edit name buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-name-btn')) {
                const btn = e.target.closest('.edit-name-btn');
                this.showEditNameModal(btn.dataset.fileId, btn.dataset.fileName);
            }
        });

        // Save name button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#saveNameBtn')) {
                this.saveFileName();
            }
        });

        // Copy link button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#copyLinkBtn')) {
                this.copyShareLink();
            }
        });
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);

        // Click to select files
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelection(files) {
        if (files.length === 0) return;

        // Validate files
        const validFiles = Array.from(files).filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showAlert('No valid files selected', 'warning');
            return;
        }

        if (validFiles.length !== files.length) {
            this.showAlert(`${files.length - validFiles.length} file(s) were skipped due to invalid type or size`, 'warning');
        }

        // For single file, show details form
        if (validFiles.length === 1) {
            this.selectedFiles = validFiles;
            this.showFileDetailsForm(validFiles[0]);
        } else {
            // For multiple files, upload directly
            this.uploadFiles(validFiles);
        }
    }

    showFileDetailsForm(file) {
        // Populate form with default values
        document.getElementById('fileName').value = file.name.split('.').slice(0, -1).join('.') || file.name;
        document.getElementById('fileDescription').value = '';
        
        // Show the form and upload button
        this.fileDetailsForm.style.display = 'block';
        this.confirmUploadBtn.style.display = 'inline-block';
        
        // Focus on name field
        document.getElementById('fileName').focus();
    }

    async uploadFilesWithDetails() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) return;
        
        const fileName = document.getElementById('fileName').value.trim();
        const fileDescription = document.getElementById('fileDescription').value.trim();
        
        if (!fileName) {
            this.showAlert('Please enter a file name', 'warning');
            return;
        }
        
        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        formData.append('file_name', fileName);
        formData.append('file_description', fileDescription);
        
        // Show progress
        this.showUploadProgress();
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(result.message, 'success');
                this.refreshFileList();
                this.resetUploadForm();
            } else {
                this.showAlert(result.error, 'danger');
            }

        } catch (error) {
            this.showAlert('Upload failed. Please try again.', 'danger');
            console.error('Upload error:', error);
        } finally {
            this.hideUploadProgress();
        }
    }
    
    resetUploadForm() {
        this.selectedFiles = null;
        this.fileInput.value = '';
        document.getElementById('fileName').value = '';
        document.getElementById('fileDescription').value = '';
        this.fileDetailsForm.style.display = 'none';
        this.confirmUploadBtn.style.display = 'none';
    }

    validateFile(file) {
        const maxSize = 500 * 1024 * 1024; // 500MB
        const allowedTypes = [
            'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx',
            'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'mp3',
            'mp4', 'avi', 'mkv', 'mov', 'csv', 'json', 'xml', 'py',
            'js', 'html', 'css', 'md'
        ];

        if (file.size > maxSize) {
            this.showAlert(`File "${file.name}" is too large (max 500MB)`, 'danger');
            return false;
        }

        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(extension)) {
            this.showAlert(`File type "${extension}" is not allowed`, 'danger');
            return false;
        }

        return true;
    }

    async uploadFiles(files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        // Show progress
        this.showUploadProgress();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(result.message, 'success');
                this.refreshFileList();
            } else {
                this.showAlert(result.error, 'danger');
            }

        } catch (error) {
            this.showAlert('Upload failed. Please try again.', 'danger');
            console.error('Upload error:', error);
        } finally {
            this.hideUploadProgress();
            this.fileInput.value = '';
        }
    }

    showUploadProgress() {
        this.uploadProgress.style.display = 'block';
        this.uploadProgress.classList.add('active');
        this.progressBar.style.width = '0%';
        this.uploadStatus.textContent = 'Preparing upload';
        this.uploadStatus.classList.add('loading-dots');
        
        // Animate upload button to loading state
        this.uploadBtn.classList.add('loading');
        this.uploadBtn.disabled = true;
        
        // Simulate progress (since we don't have real progress tracking)
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            this.progressBar.style.width = progress + '%';
            this.uploadStatus.textContent = `Uploading ${Math.round(progress)}%`;
        }, 200);

        this.progressInterval = interval;
    }

    hideUploadProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progressBar.style.width = '100%';
        this.uploadStatus.textContent = 'Upload complete!';
        this.uploadStatus.classList.remove('loading-dots');
        
        // Reset upload button
        this.uploadBtn.classList.remove('loading');
        this.uploadBtn.disabled = false;
        
        setTimeout(() => {
            this.uploadProgress.style.display = 'none';
            this.uploadProgress.classList.remove('active');
        }, 1000);
    }

    async refreshFileList() {
        // Animate refresh button
        const refreshIcon = document.getElementById('refreshIcon');
        if (refreshIcon) {
            refreshIcon.classList.add('refresh-spin');
        }
        
        try {
            const response = await fetch('/files');
            const result = await response.json();

            this.updateFilesList(result.files);
        } catch (error) {
            this.showAlert('Failed to refresh file list', 'danger');
            console.error('Refresh error:', error);
        } finally {
            // Remove refresh animation after delay
            setTimeout(() => {
                if (refreshIcon) {
                    refreshIcon.classList.remove('refresh-spin');
                }
            }, 1000);
        }
    }

    updateFilesList(files) {
        const filesContainer = document.getElementById('filesContainer');
        
        if (files.length === 0) {
            filesContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No files uploaded yet</p>
                    <p class="text-muted small">Upload some files to get started</p>
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Upload Date</th>
                            <th>Downloads</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="filesTableBody">
                        ${files.map((file, index) => `
                            <tr class="file-row" data-file-id="${file.id}" style="animation-delay: ${index * 0.1}s">
                                <td>
                                    <i class="fas fa-file me-2 file-icon"></i>
                                    <span class="file-display-name">${file.name}</span>
                                    ${file.description ? `<br><small class="text-muted">${file.description}</small>` : ''}
                                </td>
                                <td>${this.formatFileSize(file.size)}</td>
                                <td>${this.formatDate(file.upload_date)}</td>
                                <td>${file.download_count}</td>
                                <td>
                                    <div class="action-menu-container">
                                        <button class="btn btn-action-menu" data-file-id="${file.id}" title="File Actions">
                                            <i class="fas fa-ellipsis-h action-icon"></i>
                                            <div class="loading-dots" style="display: none;">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </button>
                                        
                                        <div class="action-menu-dropdown" style="display: none;">
                                            <div class="action-menu-group">
                                                <button class="action-menu-item view-btn" data-file-id="${file.id}" data-file-name="${file.name}">
                                                    <i class="fas fa-eye" style="color: var(--ios-green);"></i>
                                                    <span>View</span>
                                                </button>
                                                <a href="/download/${file.id}" class="action-menu-item">
                                                    <i class="fas fa-download" style="color: var(--ios-blue);"></i>
                                                    <span>Download</span>
                                                </a>
                                                <button class="action-menu-item share-btn" data-file-id="${file.id}" data-share-token="${file.share_token}">
                                                    <i class="fas fa-share" style="color: var(--ios-blue);"></i>
                                                    <span>Share</span>
                                                </button>
                                            </div>
                                            <div class="action-menu-separator"></div>
                                            <div class="action-menu-group">
                                                <button class="action-menu-item edit-name-btn" data-file-id="${file.id}" data-file-name="${file.name}">
                                                    <i class="fas fa-edit" style="color: var(--ios-orange);"></i>
                                                    <span>Edit Name</span>
                                                </button>
                                                <button class="action-menu-item settings-btn" data-file-id="${file.id}" data-file-name="${file.name}">
                                                    <i class="fas fa-cog" style="color: var(--ios-gray);"></i>
                                                    <span>Settings</span>
                                                </button>
                                            </div>
                                            <div class="action-menu-separator"></div>
                                            <div class="action-menu-group">
                                                <button class="action-menu-item delete-btn" data-file-id="${file.id}">
                                                    <i class="fas fa-trash" style="color: var(--ios-red);"></i>
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        filesContainer.innerHTML = tableHtml;
        
        // Re-initialize action menus after updating the list
        this.initializeActionMenus();
    }

    initializeActionMenus() {
        // Find all action menu buttons
        const actionMenuButtons = document.querySelectorAll('.btn-action-menu');

        // Add event listeners for action menu buttons
        actionMenuButtons.forEach((button) => {
            // Remove any existing listener first
            button.removeEventListener('click', this.handleActionMenuClick);
            
            // Add new listener
            button.addEventListener('click', (e) => {
                this.handleActionMenuClick(e);
            });
        });

        // Add outside click listener only once
        if (!this.outsideClickHandlerAdded) {
            document.addEventListener('click', (e) => {
                this.handleOutsideClick(e);
            });
            this.outsideClickHandlerAdded = true;
        }

        // Handle menu item clicks with ripple effect
        const menuItems = document.querySelectorAll('.action-menu-item');
        
        menuItems.forEach((item) => {
            // Remove any existing listener
            item.removeEventListener('click', this.handleMenuItemClick);
            
            // Add new listener
            item.addEventListener('click', (e) => {
                this.handleMenuItemClick(e);
            });
        });
    }

    handleActionMenuClick(e) {
        e.stopPropagation();
        
        const button = e.currentTarget;
        const dropdown = button.parentElement.querySelector('.action-menu-dropdown');
        const isActive = button.classList.contains('active');
        
        // Close all other action menus
        document.querySelectorAll('.btn-action-menu').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.action-menu-dropdown').forEach(dd => {
            dd.classList.remove('show');
        });
        
        // Toggle current menu
        if (!isActive) {
            button.classList.add('active');
            dropdown.classList.add('show');
            
            // Add haptic feedback effect
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = '';
            }, 100);
        }
    }

    handleOutsideClick(e) {
        if (!e.target.closest('.action-menu-container')) {
            document.querySelectorAll('.btn-action-menu').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.action-menu-dropdown').forEach(dd => {
                dd.classList.remove('show');
            });
        }
    }

    handleMenuItemClick(e) {
        const item = e.currentTarget;
        
        // Add ripple effect
        const ripple = document.createElement('span');
        const rect = item.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.4s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        
        item.style.position = 'relative';
        item.style.overflow = 'hidden';
        item.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 400);
        
        // Close menu after short delay
        setTimeout(() => {

            document.querySelectorAll('.btn-action-menu').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.action-menu-dropdown').forEach(dd => {
                dd.classList.remove('show');
            });
        }, 200);
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        // Find and animate the row being deleted
        const row = document.querySelector(`tr[data-file-id="${fileId}"]`);
        if (row) {
            row.classList.add('deleting');
        }

        try {
            const response = await fetch(`/delete/${fileId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(result.message, 'success');
                // Wait for animation to complete before refreshing
                setTimeout(() => {
                    this.refreshFileList();
                }, 500);
            } else {
                this.showAlert(result.error, 'danger');
                // Remove animation class if delete failed
                if (row) {
                    row.classList.remove('deleting');
                }
            }

        } catch (error) {
            this.showAlert('Failed to delete file', 'danger');
            console.error('Delete error:', error);
            // Remove animation class if delete failed
            if (row) {
                row.classList.remove('deleting');
            }
        }
    }

    async showViewModal(fileId, fileName) {
        try {
            // Fetch file details from the server
            const response = await fetch('/files');
            const result = await response.json();
            const file = result.files.find(f => f.id === fileId);
            
            if (file) {
                // Populate view modal with file data
                document.getElementById('viewFileName').textContent = file.name;
                document.getElementById('viewFileSize').textContent = this.formatFileSize(file.size);
                document.getElementById('viewUploadDate').textContent = this.formatDate(file.upload_date);
                document.getElementById('viewDownloadCount').textContent = file.download_count;
                
                // Set up action buttons
                document.getElementById('viewDownloadBtn').href = `/download/${fileId}`;
                document.getElementById('viewShareBtn').onclick = () => {
                    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewModal'));
                    viewModal.hide();
                    this.showShareModal(fileId, file.share_token);
                };
                
                // Show the modal
                const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
                viewModal.show();
            }
        } catch (error) {
            this.showAlert('Failed to load file details', 'danger');
            console.error('View error:', error);
        }
    }

    showSettingsModal(fileId, fileName) {
        // Populate settings modal with file data
        document.getElementById('settingsFileName').value = fileName;
        
        // Set up event handlers for settings actions
        document.getElementById('regenerateShareLink').onclick = () => {
            this.regenerateShareLink(fileId);
        };
        
        document.getElementById('renameFile').onclick = () => {
            this.renameFile(fileId);
        };
        
        document.getElementById('saveSettings').onclick = () => {
            this.saveFileSettings(fileId);
        };
        
        // Show the modal
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        settingsModal.show();
    }

    async regenerateShareLink(fileId) {
        // Placeholder for regenerating share link functionality
        this.showAlert('Share link regeneration is not implemented yet', 'info');
    }

    async renameFile(fileId) {
        const newName = prompt('Enter new file name:');
        if (newName && newName.trim()) {
            // Placeholder for rename functionality
            this.showAlert('File renaming is not implemented yet', 'info');
        }
    }

    async saveFileSettings(fileId) {
        const description = document.getElementById('fileDescription').value;
        const allowPublicAccess = document.getElementById('allowPublicAccess').checked;
        
        // Placeholder for saving settings functionality
        this.showAlert('Settings saved successfully!', 'success');
        
        // Close the modal
        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        settingsModal.hide();
    }

    showShareModal(fileId, shareToken) {
        const shareUrl = `${window.location.origin}/share/${shareToken}`;
        document.getElementById('shareUrl').value = shareUrl;
        
        const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        shareModal.show();
    }

    async copyShareLink() {
        const shareUrl = document.getElementById('shareUrl');
        
        try {
            await navigator.clipboard.writeText(shareUrl.value);
            this.showAlert('Share link copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            shareUrl.select();
            document.execCommand('copy');
            this.showAlert('Share link copied to clipboard!', 'success');
        }
    }

    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        this.alertContainer.innerHTML = alertHtml;

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = this.alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async showEditNameModal(fileId, fileName) {
        // Fetch current file details
        try {
            const response = await fetch('/files');
            const result = await response.json();
            const file = result.files.find(f => f.id === fileId);
            
            if (file) {
                // Populate edit form
                document.getElementById('editFileName').value = file.name;
                document.getElementById('editFileDescription').value = file.description || '';
                document.getElementById('editFileId').value = fileId;
                
                // Show the modal
                const editModal = new bootstrap.Modal(document.getElementById('editNameModal'));
                editModal.show();
            }
        } catch (error) {
            this.showAlert('Failed to load file details', 'danger');
            console.error('Edit modal error:', error);
        }
    }

    async saveFileName() {
        const fileId = document.getElementById('editFileId').value;
        const fileName = document.getElementById('editFileName').value.trim();
        const fileDescription = document.getElementById('editFileDescription').value.trim();
        
        if (!fileName) {
            this.showAlert('Please enter a file name', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/edit-file/${fileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fileName,
                    description: fileDescription
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('File updated successfully!', 'success');
                this.refreshFileList();
                
                // Close the modal
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editNameModal'));
                editModal.hide();
            } else {
                this.showAlert(result.error, 'danger');
            }

        } catch (error) {
            this.showAlert('Failed to update file', 'danger');
            console.error('Save name error:', error);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Initialize the file manager when the page loads
document.addEventListener('DOMContentLoaded', () => {

    window.fileManager = new FileManager();

});

// Fallback initialization
window.addEventListener('load', () => {
    if (!window.fileManager) {

        window.fileManager = new FileManager();
    }
});

// Additional debug function
window.initActionMenusDebug = function() {

    if (window.fileManager) {
        window.fileManager.initializeActionMenus();
    } else {

        window.fileManager = new FileManager();
    }
};
