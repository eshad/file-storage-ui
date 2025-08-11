const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads';
    
    // Handle folder path for nested directories
    if (req.body.folderPath) {
      uploadPath = path.join('uploads', req.body.folderPath);
    }
    
    // Ensure the directory exists
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Ensure uploads directory exists
fs.ensureDirSync('uploads');

// API Routes

// Get file tree structure
app.get('/api/files', async (req, res) => {
  try {
    const basePath = 'uploads';
    const tree = await buildFileTree(basePath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file tree' });
  }
});

// Upload files
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      url: `/api/files/${encodeURIComponent(file.filename)}`
    }));
    
    res.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Create folder
app.post('/api/folders', async (req, res) => {
  try {
    const { name, parentPath = '' } = req.body;
    
    // Validate folder name
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Sanitize folder name
    const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_');
    
    const folderPath = path.join('uploads', parentPath, sanitizedName);
    
    if (await fs.pathExists(folderPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }
    
    await fs.ensureDir(folderPath);
    
    res.json({ 
      success: true, 
      path: path.relative('uploads', folderPath),
      fullPath: folderPath,
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Delete files/folders
app.delete('/api/delete', async (req, res) => {
  try {
    const { items } = req.body;
    const deletedItems = [];
    
    for (const item of items) {
      const itemPath = path.join('uploads', item);
      if (await fs.pathExists(itemPath)) {
        await fs.remove(itemPath);
        deletedItems.push(item);
      }
    }
    
    res.json({ 
      success: true, 
      deletedItems,
      message: `${deletedItems.length} item(s) deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete items' });
  }
});

// Rename file or folder
app.put('/api/rename', async (req, res) => {
  try {
    const { oldPath, newName } = req.body;
    
    if (!oldPath || !newName) {
      return res.status(400).json({ error: 'Old path and new name are required' });
    }
    
    const oldFullPath = path.join('uploads', oldPath);
    const parentDir = path.dirname(oldFullPath);
    const newFullPath = path.join(parentDir, newName);
    
    if (!await fs.pathExists(oldFullPath)) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (await fs.pathExists(newFullPath)) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    
    await fs.move(oldFullPath, newFullPath);
    
    res.json({ 
      success: true, 
      oldPath,
      newPath: path.relative('uploads', newFullPath),
      message: 'Item renamed successfully'
    });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: 'Failed to rename item' });
  }
});

// Serve files
app.get('/api/files/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join('uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Helper function to build file tree
async function buildFileTree(dirPath, relativePath = '') {
  const tree = [];
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        const children = await buildFileTree(fullPath, itemRelativePath);
        tree.push({
          name: item,
          type: 'folder',
          path: itemRelativePath,
          children: children,
          size: 0,
          modified: stats.mtime
        });
      } else {
        tree.push({
          name: item,
          type: 'file',
          path: itemRelativePath,
          size: stats.size,
          modified: stats.mtime,
          url: `/api/files/${encodeURIComponent(item)}`
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return tree.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Storage Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
}); 