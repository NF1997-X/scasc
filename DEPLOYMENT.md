# Panduan Deploy ke Pelbagai Platform

Aplikasi SCASC (File Manager dengan iOS Black Glass Design) boleh di-deploy ke beberapa platform hosting. Berikut adalah panduan lengkap untuk setiap platform.

## 🚀 Platform yang Disokong

### 1. Railway (Recommended - Mudah & Percuma)
### 2. Render (Free Tier Available)
### 3. Heroku (Basic Plan)
### 4. Vercel (Static/Serverless)
### 5. Docker (Self-hosting)

---

## 🚂 Railway Deployment

Railway adalah platform yang paling mudah untuk deploy Flask apps.

### Langkah-langkah:
1. **Buat akaun di [Railway](https://railway.app)**
2. **Connect GitHub repo anda**
3. **Deploy secara automatik:**
   - Railway akan detect Python app
   - Gunakan `railway.toml` yang sudah disediakan
   - Database PostgreSQL akan dibuat secara automatik

### Environment Variables di Railway:
```
DATABASE_URL: ${{ Postgres.DATABASE_URL }}
SESSION_SECRET: generate-random-secret
FLASK_ENV: production
```

### Kos: Free tier dengan 5$ credit/bulan

---

## 🎨 Render Deployment

Render menyediakan free tier untuk web apps.

### Langkah-langkah:
1. **Buat akaun di [Render](https://render.com)**
2. **Connect GitHub repo**
3. **Buat Database PostgreSQL:**
   - Pergi ke Dashboard > New > PostgreSQL
   - Pilih free tier
   - Catat connection string
4. **Deploy Web Service:**
   - Pilih repo anda
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Add environment variables

### Environment Variables di Render:
```
DATABASE_URL: [PostgreSQL connection string]
SESSION_SECRET: generate-random-secret
FLASK_ENV: production
PYTHON_VERSION: 3.12.3
```

### Kos: Free tier tersedia dengan limitations

---

## 🟣 Heroku Deployment

Heroku adalah platform classic untuk web apps.

### Langkah-langkah:
1. **Install Heroku CLI**
2. **Login dan create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. **Add PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set SESSION_SECRET=your-secret-key
   heroku config:set FLASK_ENV=production
   ```
5. **Deploy:**
   ```bash
   git push heroku main
   ```

### Kos: Basic plan ~$7/bulan

---

## ⚡ Vercel Deployment

Vercel bagus untuk serverless deployment.

### Langkah-langkah:
1. **Buat akaun di [Vercel](https://vercel.com)**
2. **Connect GitHub repo**
3. **Vercel akan detect Python app**
4. **Configure environment variables:**
   - Pergi ke Project Settings > Environment Variables

### Environment Variables di Vercel:
```
DATABASE_URL: [External PostgreSQL URL]
SESSION_SECRET: generate-random-secret
FLASK_ENV: production
```

### Note: Anda perlu external database (Railway PostgreSQL, PlanetScale, dll.)

---

## 🐳 Docker Deployment

Untuk self-hosting atau cloud providers.

### Langkah-langkah:
1. **Build image:**
   ```bash
   docker build -t scasc .
   ```
2. **Run container:**
   ```bash
   docker run -d -p 5000:5000 \
     -e DATABASE_URL=your-db-url \
     -e SESSION_SECRET=your-secret \
     -e FLASK_ENV=production \
     scasc
   ```

### Cloud deployment dengan Docker:
- **DigitalOcean App Platform**
- **Google Cloud Run**
- **AWS ECS**

---

## 📋 Checklist Sebelum Deploy

- [ ] Test app secara local
- [ ] Set environment variables yang betul
- [ ] Ensure requirements.txt updated
- [ ] Database migration ready
- [ ] Static files configured
- [ ] Security settings checked

## 🛠 Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check DATABASE_URL format
   - Ensure database exists dan accessible

2. **Static Files Not Loading:**
   - Check file paths dalam templates
   - Ensure static folder structure correct

3. **App Crashes:**
   - Check logs: `heroku logs --tail` (Heroku)
   - Verify environment variables
   - Check Python version compatibility

## 📞 Support

Jika ada masalah dengan deployment, semak:
- Platform documentation
- Application logs
- Environment variables
- Database connection

---

**Recommendation: Mulakan dengan Railway untuk development, kemudian scale ke Render atau Heroku untuk production.**