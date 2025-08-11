// Global variables
let selectedFiles = new Set();
let currentFolder = '';
let fileTreeData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadFileTree();
    setupDragAndDrop();
    setupFileInput();
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadSection = document.getElementById('uploadSection');
    
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });
    
    uploadSection.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
    });
    
    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        uploadFiles(files);
    });
}

// Setup file input
function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        uploadFiles(files);
    });
}

// Load file tree from server
async function loadFileTree() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        fileTreeData = data;
        renderFileTree(data);
        renderFilesGrid(data);
    } catch (error) {
        showToast('Failed to load files', 'error');
    }
}

// Render file tree in sidebar
function renderFileTree(data) {
    const fileTree = document.getElementById('fileTree');
    
    if (data.length === 0) {
        fileTree.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No files yet</h3>
                <p>Upload some files to get started</p>
            </div>
        `;
        return;
    }
    
    fileTree.innerHTML = '';
    data.forEach(item => {
        fileTree.appendChild(createTreeItem(item));
    });
}

// Create tree item element
function createTreeItem(item) {
    const treeItem = document.createElement('div');
    treeItem.className = `tree-item ${item.type}`;
    treeItem.dataset.path = item.path;
    
    const icon = item.type === 'folder' ? 'fas fa-folder' : getFileIcon(item.name);
    const name = item.name;
    
    treeItem.innerHTML = `
        <i class="${icon}"></i>
        <span>${name}</span>
        <div class="tree-item-actions" style="margin-left: auto; opacity: 0; transition: opacity 0.2s;">
            <button class="tree-action-btn" onclick="event.stopPropagation(); renameItem('${item.path}', '${item.name}')" title="Rename">
                <i class="fas fa-edit"></i>
            </button>
            <button class="tree-action-btn" onclick="event.stopPropagation(); deleteItem('${item.path}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Show actions on hover
    treeItem.addEventListener('mouseenter', () => {
        const actions = treeItem.querySelector('.tree-item-actions');
        actions.style.opacity = '1';
    });
    
    treeItem.addEventListener('mouseleave', () => {
        const actions = treeItem.querySelector('.tree-item-actions');
        actions.style.opacity = '0';
    });
    
    if (item.type === 'folder') {
        treeItem.addEventListener('click', () => {
            toggleFolder(treeItem, item);
        });
        
        // Add context menu for folder creation
        treeItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            currentFolder = item.path;
            showNewFolderModal();
        });
        
        if (item.children && item.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            childrenContainer.style.display = 'none';
            
            item.children.forEach(child => {
                childrenContainer.appendChild(createTreeItem(child));
            });
            
            treeItem.appendChild(childrenContainer);
        }
    } else {
        treeItem.addEventListener('click', () => {
            selectTreeItem(treeItem);
        });
    }
    
    return treeItem;
}

// Toggle folder expansion
function toggleFolder(treeItem, item) {
    const childrenContainer = treeItem.querySelector('.tree-children');
    
    if (childrenContainer) {
        const isExpanded = childrenContainer.style.display !== 'none';
        childrenContainer.style.display = isExpanded ? 'none' : 'block';
        treeItem.classList.toggle('expanded', !isExpanded);
    }
}

// Select tree item
function selectTreeItem(treeItem) {
    document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('selected');
    });
    treeItem.classList.add('selected');
    currentFolder = treeItem.dataset.path;
    updateBreadcrumb(currentFolder);
}

// Get file icon based on file extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'txt': 'fas fa-file-alt',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'svg': 'fas fa-file-image',
        'mp4': 'fas fa-file-video',
        'avi': 'fas fa-file-video',
        'mov': 'fas fa-file-video',
        'mp3': 'fas fa-file-audio',
        'wav': 'fas fa-file-audio',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive',
        '7z': 'fas fa-file-archive'
    };
    
    return iconMap[ext] || 'fas fa-file';
}

// Upload files
async function uploadFiles(files = null) {
    if (!files) {
        const fileInput = document.getElementById('fileInput');
        files = Array.from(fileInput.files);
    }
    
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    
    if (currentFolder) {
        formData.append('folderPath', currentFolder);
    }
    
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressContainer.style.display = 'block';
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                showToast(response.message, 'success');
                loadFileTree();
                document.getElementById('fileInput').value = '';
            } else {
                showToast('Upload failed', 'error');
            }
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        });
        
        xhr.addEventListener('error', () => {
            showToast('Upload failed', 'error');
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        });
        
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
        
    } catch (error) {
        showToast('Upload failed', 'error');
        progressContainer.style.display = 'none';
    }
}

// Render files grid
function renderFilesGrid(data) {
    // Show current folder contents instead of all files
    showFolderContents(currentFolder);
}

// Create file card element
function createFileCard(item) {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.dataset.path = item.path;
    
    const icon = getFileIcon(item.name);
    const size = formatFileSize(item.size);
    const date = new Date(item.modified).toLocaleDateString();
    
    fileCard.innerHTML = `
        <div class="file-icon">
            <i class="${icon}"></i>
        </div>
        <div class="file-name">${item.name}</div>
        <div class="file-info">
            <div>${size}</div>
            <div>${date}</div>
        </div>
        <div class="file-actions">
            <button class="file-action-btn" onclick="copyFileUrl('${item.url}')">
                <i class="fas fa-link"></i> Copy URL
            </button>
            <button class="file-action-btn" onclick="downloadFile('${item.url}', '${item.name}')">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="file-action-btn" onclick="renameItem('${item.path}', '${item.name}')">
                <i class="fas fa-edit"></i> Rename
            </button>
            <button class="file-action-btn" onclick="deleteItem('${item.path}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    fileCard.addEventListener('click', (e) => {
        if (!e.target.closest('.file-action-btn')) {
            toggleFileSelection(fileCard);
        }
    });
    
    return fileCard;
}

// Toggle file selection
function toggleFileSelection(fileCard) {
    const path = fileCard.dataset.path;
    
    if (selectedFiles.has(path)) {
        selectedFiles.delete(path);
        fileCard.classList.remove('selected');
    } else {
        selectedFiles.add(path);
        fileCard.classList.add('selected');
    }
}

// Select all files
function selectAll() {
    const fileCards = document.querySelectorAll('.file-card');
    fileCards.forEach(card => {
        selectedFiles.add(card.dataset.path);
        card.classList.add('selected');
    });
}

// Copy file URL
function copyFileUrl(url) {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('URL copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy URL', 'error');
    });
}

// Copy selected URLs
function copySelectedUrls() {
    if (selectedFiles.size === 0) {
        showToast('No files selected', 'error');
        return;
    }
    
    const urls = Array.from(selectedFiles).map(path => {
        const file = findFileByPath(fileTreeData, path);
        return file ? window.location.origin + file.url : null;
    }).filter(url => url);
    
    if (urls.length > 0) {
        navigator.clipboard.writeText(urls.join('\n')).then(() => {
            showToast(`${urls.length} URL(s) copied to clipboard`, 'success');
        }).catch(() => {
            showToast('Failed to copy URLs', 'error');
        });
    }
}

// Download file
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete selected files
async function deleteSelected() {
    if (selectedFiles.size === 0) {
        showToast('No files selected', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected item(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: Array.from(selectedFiles)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            selectedFiles.clear();
            loadFileTree();
        } else {
            showToast('Failed to delete items', 'error');
        }
    } catch (error) {
        showToast('Failed to delete items', 'error');
    }
}

// Show new folder modal
function showNewFolderModal() {
    const modal = document.getElementById('newFolderModal');
    modal.classList.add('show');
    document.getElementById('folderNameInput').focus();
}

// Close new folder modal
function closeNewFolderModal() {
    const modal = document.getElementById('newFolderModal');
    modal.classList.remove('show');
    document.getElementById('folderNameInput').value = '';
}

// Create new folder
async function createFolder() {
    const folderName = document.getElementById('folderNameInput').value.trim();
    
    if (!folderName) {
        showToast('Please enter a folder name', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: folderName,
                parentPath: currentFolder
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeNewFolderModal();
            loadFileTree();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to create folder', 'error');
    }
}

// Find file by path
function findFileByPath(data, targetPath) {
    for (const item of data) {
        if (item.path === targetPath) {
            return item;
        }
        if (item.children) {
            const found = findFileByPath(item.children, targetPath);
            if (found) return found;
        }
    }
    return null;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Handle modal backdrop click
document.getElementById('newFolderModal').addEventListener('click', (e) => {
    if (e.target.id === 'newFolderModal') {
        closeNewFolderModal();
    }
});

document.getElementById('renameModal').addEventListener('click', (e) => {
    if (e.target.id === 'renameModal') {
        closeRenameModal();
    }
});

// Handle Enter key in folder name input
document.getElementById('folderNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createFolder();
    }
});

// Handle Enter key in rename input
document.getElementById('renameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performRename();
    }
});

// Update breadcrumb navigation
function updateBreadcrumb(folderPath) {
    const breadcrumb = document.getElementById('breadcrumb');
    
    if (!folderPath || folderPath === '') {
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item" onclick="navigateToFolder('')">
                <i class="fas fa-home"></i> Home
            </span>
        `;
        return;
    }
    
    const pathParts = folderPath.split('/');
    let breadcrumbHTML = `
        <span class="breadcrumb-item" onclick="navigateToFolder('')">
            <i class="fas fa-home"></i> Home
        </span>
    `;
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
        if (part) {
            currentPath += (currentPath ? '/' : '') + part;
            breadcrumbHTML += `
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-item" onclick="navigateToFolder('${currentPath}')">
                    ${part}
                </span>
            `;
        }
    });
    
    breadcrumb.innerHTML = breadcrumbHTML;
}

// Navigate to specific folder
function navigateToFolder(folderPath) {
    currentFolder = folderPath;
    updateBreadcrumb(folderPath);
    updateUploadLocation(folderPath);
    
    // Update tree selection
    document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.path === folderPath) {
            item.classList.add('selected');
        }
    });
    
    // Show current folder contents in grid
    showFolderContents(folderPath);
}

// Update upload location text
function updateUploadLocation(folderPath) {
    const uploadLocation = document.getElementById('uploadLocation');
    if (folderPath && folderPath !== '') {
        uploadLocation.textContent = `Uploading to: ${folderPath} • Support for multiple files, max 100MB per file`;
    } else {
        uploadLocation.textContent = 'Support for multiple files, max 100MB per file';
    }
}

// Show folder contents in grid
function showFolderContents(folderPath) {
    const filesGrid = document.getElementById('filesGrid');
    
    // Find the folder in the tree data
    const folder = findFolderByPath(fileTreeData, folderPath);
    
    if (!folder || !folder.children) {
        filesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Empty folder</h3>
                <p>This folder is empty</p>
            </div>
        `;
        return;
    }
    
    const files = folder.children.filter(item => item.type === 'file');
    
    if (files.length === 0) {
        filesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No files in this folder</h3>
                <p>Upload files to see them here</p>
            </div>
        `;
        return;
    }
    
    filesGrid.innerHTML = '';
    files.forEach(item => {
        filesGrid.appendChild(createFileCard(item));
    });
}

// Find folder by path in tree data
function findFolderByPath(data, targetPath) {
    for (const item of data) {
        if (item.path === targetPath) {
            return item;
        }
        if (item.children) {
            const found = findFolderByPath(item.children, targetPath);
            if (found) return found;
        }
    }
    return null;
}

// Global variables for rename operation
let renameItemPath = '';
let renameItemName = '';

// Rename selected items
function renameSelected() {
    if (selectedFiles.size === 0) {
        showToast('No files selected', 'error');
        return;
    }
    
    if (selectedFiles.size > 1) {
        showToast('Please select only one item to rename', 'error');
        return;
    }
    
    const selectedPath = Array.from(selectedFiles)[0];
    const item = findFileByPath(fileTreeData, selectedPath);
    
    if (item) {
        renameItem(selectedPath, item.name);
    }
}

// Rename item (called from tree or grid)
function renameItem(path, currentName) {
    renameItemPath = path;
    renameItemName = currentName;
    
    const modal = document.getElementById('renameModal');
    const input = document.getElementById('renameInput');
    
    input.value = currentName;
    input.select();
    modal.classList.add('show');
}

// Close rename modal
function closeRenameModal() {
    const modal = document.getElementById('renameModal');
    modal.classList.remove('show');
    document.getElementById('renameInput').value = '';
    renameItemPath = '';
    renameItemName = '';
}

// Perform rename operation
async function performRename() {
    const newName = document.getElementById('renameInput').value.trim();
    
    if (!newName) {
        showToast('Please enter a new name', 'error');
        return;
    }
    
    if (newName === renameItemName) {
        closeRenameModal();
        return;
    }
    
    try {
        const response = await fetch('/api/rename', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPath: renameItemPath,
                newName: newName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeRenameModal();
            loadFileTree();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to rename item', 'error');
    }
}

// Delete single item (called from tree)
async function deleteItem(path) {
    const item = findFileByPath(fileTreeData, path);
    const itemName = item ? item.name : path.split('/').pop();
    
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [path]
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadFileTree();
        } else {
            showToast('Failed to delete item', 'error');
        }
    } catch (error) {
        showToast('Failed to delete item', 'error');
    }
} 