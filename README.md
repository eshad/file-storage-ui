# Storage Server - Professional File Management UI

A beautiful and professional Node.js storage server with an elegant web interface for file management, featuring drag-and-drop uploads, folder organization, and file sharing capabilities.

## ✨ Features

- **🎨 Beautiful UI/UX**: Modern, responsive design with gradient backgrounds and glassmorphism effects
- **📁 File Tree Navigation**: Hierarchical folder structure with expandable tree view
- **📤 Drag & Drop Upload**: Intuitive file upload with drag-and-drop support
- **📊 Upload Progress**: Real-time progress tracking with animated progress bars
- **🔗 File Sharing**: Copy direct URLs to files for easy sharing
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **🗂️ Folder Management**: Create and organize files in folders
- **⚡ Bulk Operations**: Select multiple files for deletion or URL copying
- **🎯 File Type Icons**: Automatic file type detection with appropriate icons
- **🔒 Secure**: File size limits and proper error handling

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd storage-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **For development with auto-restart:**
   ```bash
   npm run dev
   ```

5. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Uploading Files

1. **Drag & Drop**: Simply drag files from your computer and drop them onto the upload area
2. **Click to Upload**: Click "Choose Files" to select files from your file browser
3. **Multiple Files**: Select multiple files at once for batch upload
4. **Progress Tracking**: Watch the real-time progress bar during uploads

### Managing Folders

1. **Create Folder**: Click the "New Folder" button in the sidebar
2. **Navigate**: Click on folders in the tree to navigate into them
3. **Upload to Folder**: Files will be uploaded to the currently selected folder

### File Operations

1. **Select Files**: Click on file cards to select them (multiple selection supported)
2. **Copy URLs**: Use the "Copy URL" button on individual files or "Copy URLs" for selected files
3. **Download**: Click the "Download" button to download files directly
4. **Delete**: Select files and click "Delete" to remove them

### File Tree Navigation

- **Expand/Collapse**: Click on folder names to expand or collapse them
- **Current Location**: The selected folder is highlighted in the tree
- **Breadcrumb**: The current folder path is maintained for uploads

## 🛠️ API Endpoints

The server provides the following REST API endpoints:

- `GET /api/files` - Get file tree structure
- `POST /api/upload` - Upload files (multipart/form-data)
- `POST /api/folders` - Create new folder
- `DELETE /api/delete` - Delete files/folders
- `GET /api/files/:filename` - Download/serve files

## 📁 Project Structure

```
storage-ui/
├── server.js          # Main Express server
├── package.json       # Dependencies and scripts
├── public/
│   ├── index.html     # Main HTML interface
│   └── script.js      # Frontend JavaScript
├── uploads/           # File storage directory (auto-created)
└── README.md          # This file
```

## ⚙️ Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 100MB)

### File Limits

- **Maximum file size**: 100MB per file
- **Supported formats**: All file types
- **Storage location**: `./uploads/` directory

## 🎨 Customization

### Styling

The application uses modern CSS with:
- CSS Grid and Flexbox for layout
- CSS Custom Properties for theming
- Smooth animations and transitions
- Responsive design patterns

### Adding Features

The modular JavaScript structure makes it easy to add new features:
- File preview functionality
- File search and filtering
- User authentication
- File versioning
- Cloud storage integration

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Building for Production

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. The application is ready to serve files

## 🌟 Features in Detail

### Upload Features
- **Drag & Drop**: Intuitive file upload interface
- **Progress Tracking**: Real-time upload progress with percentage
- **Multiple Files**: Upload several files simultaneously
- **Folder Upload**: Upload files to specific folders
- **File Validation**: Size and type validation

### File Management
- **Tree View**: Hierarchical file organization
- **File Cards**: Beautiful file representation with icons
- **Bulk Operations**: Select and manage multiple files
- **File Information**: Size, date, and type display
- **Direct Downloads**: One-click file downloads

### User Experience
- **Toast Notifications**: Success and error feedback
- **Loading States**: Visual feedback during operations
- **Responsive Design**: Works on all screen sizes
- **Keyboard Navigation**: Full keyboard support
- **Accessibility**: Screen reader friendly

## 🚀 Deployment

### Local Development
```bash
npm install
npm start
```

### Production Deployment
1. Set up a production server
2. Install Node.js and npm
3. Clone the repository
4. Install dependencies: `npm install --production`
5. Start the server: `npm start`
6. Configure reverse proxy (nginx/Apache) if needed

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify the uploads directory has write permissions
4. Check that the port is not already in use

## 🔮 Future Enhancements

- [ ] User authentication and authorization
- [ ] File preview for images and documents
- [ ] Advanced search and filtering
- [ ] File sharing with expiration dates
- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] File versioning and history
- [ ] Collaborative features
- [ ] Mobile app companion

---

**Enjoy your professional file management experience! 🎉** 