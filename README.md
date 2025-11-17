# SCASC - File Manager with iOS Black Glass Design

A modern, elegant file management system with iOS-inspired glassmorphism design.

## ✨ Features

- 🎨 **iOS Black Glass Design** - Beautiful glassmorphism UI
- 📁 **File Upload & Management** - Drag & drop, multiple file support
- 🔗 **File Sharing** - Generate shareable links
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⚡ **Fast Performance** - Optimized for speed
- 🔒 **Secure** - File deduplication and secure storage

## 🚀 Quick Deploy

### Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Heroku
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## 🛠 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NF1997-X/scasc.git
   cd scasc
   ```

2. **Setup virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open browser:**
   Visit `http://localhost:5000`

## 📁 Project Structure

```
scasc/
├── app.py              # Main Flask application
├── models.py           # Database models
├── requirements.txt    # Python dependencies
├── Procfile           # Heroku configuration
├── railway.toml       # Railway configuration
├── render.yaml        # Render configuration
├── vercel.json        # Vercel configuration
├── Dockerfile         # Docker configuration
├── static/            # Static files (CSS, JS)
│   ├── css/
│   │   ├── ios-black-glass.css
│   │   └── button-enhancements.css
│   └── js/
│       └── filemanager.js
├── templates/         # HTML templates
│   ├── index.html
│   ├── shared.html
│   └── demo.html
├── uploads/           # Uploaded files storage
└── instance/          # Database storage
```

## 🎨 Design System

The application features a custom iOS Black Glass design system with:

- **Glassmorphism Effects** - Backdrop blur and transparency
- **iOS Color Palette** - Authentic iOS colors and gradients
- **Smooth Animations** - 120fps animations and transitions
- **Touch-Friendly Interface** - Optimized for mobile interactions
- **Dark Mode First** - Beautiful dark theme as primary

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///instance/app.db` |
| `SESSION_SECRET` | Secret key for sessions | Required for production |
| `FLASK_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

### Database Support

- **SQLite** - For development and small deployments
- **PostgreSQL** - For production deployments
- **MySQL** - Supported via SQLAlchemy

## 📱 Screenshots

![iOS Black Glass Design](static/images/screenshot-main.png)
![Action Menu](static/images/screenshot-menu.png)
![Mobile View](static/images/screenshot-mobile.png)

## 🚀 Deployment Options

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions:

- **Railway** - Easiest deployment with free tier
- **Render** - Free tier with PostgreSQL
- **Heroku** - Classic platform with addons
- **Vercel** - Serverless deployment
- **Docker** - Self-hosting option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Open an issue on GitHub
- Check the logs for error details

## 🔄 Roadmap

- [ ] User authentication
- [ ] Folder organization
- [ ] File preview
- [ ] Bulk operations
- [ ] API endpoints
- [ ] File versioning

---

**Built with ❤️ using Flask and iOS-inspired design**