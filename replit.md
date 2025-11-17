# Overview

A Flask-based file sharing platform that allows users to upload, share, and download files through a web interface. The application provides a simple drag-and-drop file upload experience with shareable links for easy file distribution. Files are stored locally on the server with metadata tracked in JSON format, making it a lightweight solution for basic file sharing needs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Vanilla JavaScript with Bootstrap 5 for UI components
- **Design Pattern**: Event-driven architecture using a FileManager class to handle file operations
- **User Interface**: Dark theme Bootstrap UI with drag-and-drop file upload zone
- **Styling**: Custom CSS for enhanced drag-and-drop experience and responsive design

## Backend Architecture
- **Framework**: Flask (Python) web framework for server-side logic
- **File Storage**: Local filesystem storage in `uploads/` directory
- **Metadata Management**: JSON-based metadata storage in `metadata/files.json`
- **Route Structure**: RESTful endpoints for file operations (upload, download, share, delete)
- **Security**: File type validation and secure filename handling using Werkzeug utilities

## Data Storage Solutions
- **File Storage**: Direct filesystem storage with organized directory structure
- **Metadata Storage**: Flat-file JSON database for tracking file information, upload dates, download counts, and share tokens
- **Session Management**: Flask session handling with configurable secret key

## Authentication and Authorization
- **File Access Control**: UUID-based file identification with optional share tokens
- **Public Sharing**: Share tokens enable public access to specific files without authentication
- **File Ownership**: Basic file management through the web interface (no user accounts)

## Key Architectural Decisions
- **Stateless Design**: No database dependency, using JSON files for simplicity and portability
- **File Size Limits**: 500MB maximum file size to prevent resource exhaustion
- **Allowed File Types**: Comprehensive whitelist of common file extensions for security
- **Progressive Enhancement**: JavaScript-enhanced interface that degrades gracefully

# External Dependencies

## Frontend Libraries
- **Bootstrap 5**: UI framework for responsive design and components
- **Font Awesome 6.4.0**: Icon library for enhanced user interface
- **Bootstrap Agent Dark Theme**: Replit-specific dark theme styling

## Backend Dependencies
- **Flask**: Core web framework for Python
- **Werkzeug**: WSGI utilities for secure file handling and request processing

## Runtime Environment
- **Python**: Server runtime environment
- **File System**: Local storage for uploads and metadata
- **Environment Variables**: SESSION_SECRET for Flask session configuration

## Development Tools
- **Logging**: Python logging module configured for debugging
- **Development Server**: Flask development server with debug mode enabled