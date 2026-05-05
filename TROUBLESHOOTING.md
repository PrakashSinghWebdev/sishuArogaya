# 🔧 Shishu Arogaya - Troubleshooting Guide

## ✅ Pre-Flight Checklist

- [ ] Node.js v24.14.0+ installed (`node --version`)
- [ ] npm 11.9.0+ installed (`npm --version`)
- [ ] MongoDB running (`mongosh` or `mongo` works)
- [ ] Port 5000 is available
- [ ] Port 5175 is available
- [ ] `.env` file exists in `server/` directory
- [ ] All dependencies installed (`npm install` in both client and server)

---

## 🚀 Quick Troubleshoot

### Everything is Working? ✓
```bash
# Run the startup script
# Windows:
start-dev.bat

# Mac/Linux:
bash start-dev.sh
```

Then open: `http://localhost:5175/login`

---

## 🆘 Common Issues & Solutions

### Issue 1: "Port 5000 already in use"

**Symptoms**: Server won't start, "EADDRINUSE" error

**Solutions**:

**Option A: Kill existing process**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

**Option B: Change the port**
```bash
# Edit server/.env
PORT=5001  # Change to different port
```

**Option C: Check what's using the port**
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

---

### Issue 2: "Port 5175 already in use"

**Symptoms**: Client won't start, port conflict

**Solution**:
```bash
# Edit client/vite.config.js
export default defineConfig({
  server: {
    port: 5176  // Change to different port
  }
});
```

Then access at: `http://localhost:5176`

---

### Issue 3: "MongoDB connection error"

**Symptoms**:
```
MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions**:

**Option A: Start MongoDB**
```bash
# Windows
mongod

# Mac (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: Check if MongoDB is installed**
```bash
mongod --version

# If not installed:
# Windows: Download from mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb
```

**Option C: Change MongoDB URI**
```bash
# If MongoDB is on different host, edit server/.env
MONGO_URI=mongodb://192.168.1.100:27017/sishuarogaya
```

---

### Issue 4: "Cannot find module 'react'"

**Symptoms**:
```
Error: Cannot find module 'react'
```

**Solutions**:

**Option A: Install dependencies**
```bash
cd client
npm install

cd ../server
npm install
```

**Option B: Clear npm cache and reinstall**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Option C: Use npm ci for clean install**
```bash
npm ci  # Install exact versions from package-lock.json
```

---

### Issue 5: "CORS error or API calls failing"

**Symptoms**:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions**:

**Check 1: Server is running**
```bash
# In server terminal
npm run dev

# Test server:
curl http://localhost:5000/api/health
```

**Check 2: Client proxy is configured**
```bash
# client/vite.config.js should have:
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

**Check 3: CORS is enabled in server**
```bash
# server/server.js should have:
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5175' }));
```

**Check 4: .env is configured correctly**
```bash
# server/.env should have:
CLIENT_URL=http://localhost:5175
```

---

### Issue 6: "401 Unauthorized errors"

**Symptoms**:
```
401: Unauthorized
{"message":"Invalid or expired token"}
```

**Solutions**:

**Option A: Clear localStorage and re-login**
```javascript
// In browser console
localStorage.clear();
// Then refresh page and login again
```

**Option B: Check JWT_SECRET**
```bash
# server/.env
JWT_SECRET=sishu-arogaya-super-secret-key-2024  # Must match both frontend and backend
```

**Option C: Check token storage**
```javascript
// In browser console
console.log(localStorage.getItem('sa_token'));
// Should show a long JWT token
```

---

### Issue 7: "Blank page or loading spinner"

**Symptoms**:
- Page stuck on loading spinner
- No console errors

**Solutions**:

**Option A: Check API responses**
```bash
# Open browser DevTools (F12)
# Go to Network tab
# Check if API calls are succeeding
# Look for red 500 or 401 errors
```

**Option B: Check server logs**
```
# In server terminal, look for errors
# Should see: [dotenv] injecting env...
# Should see: Sishu Arogaya server running on port 5000
```

**Option C: Clear browser cache**
```bash
# Clear localStorage
localStorage.clear()

# Clear cache in DevTools
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
```

**Option D: Hard refresh browser**
```
Windows/Linux: Ctrl+Shift+R
Mac: Cmd+Shift+R
```

---

### Issue 8: "Build fails with syntax error"

**Symptoms**:
```
error during build:
[vite:esbuild] Transform failed with 1 error
```

**Solutions**:

**Check 1: Invalid JSX syntax**
```bash
# Look at the file and line number in error
# Fix common issues:
# - Missing closing tags
# - Unmatched brackets
# - Invalid JavaScript in JSX
```

**Check 2: Run build and see full error**
```bash
cd client
npm run build  # Shows full error with line numbers
```

**Check 3: Validate all .jsx files**
```bash
# Install ESLint to catch errors early
npm install eslint --save-dev
npx eslint src/**/*.jsx
```

---

### Issue 9: "Email not sending / SMTP error"

**Symptoms**:
```
Error: SMTP authentication failed
```

**Solutions**:

**For Gmail SMTP**:
```bash
# 1. Enable 2FA on Gmail account
# 2. Generate App Password at: https://myaccount.google.com/apppasswords
# 3. Update server/.env:
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**For SendGrid**:
```bash
# 1. Get API key from: https://app.sendgrid.com/settings/api_keys
# 2. Update server/.env:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
```

**For testing without email**:
```bash
# Dev mode returns OTP in response if email is not configured
# Check server response in Network tab or console
```

---

### Issue 10: "High CPU usage or slow performance"

**Symptoms**:
- App running slowly
- High CPU/memory usage

**Solutions**:

**Option A: Check for memory leaks**
```bash
# Use Chrome DevTools Memory profiler
# Look for growing heap size
```

**Option B: Stop unnecessary services**
```bash
# Close other apps using ports 5000/5175
# Restart both server and client
```

**Option C: Clear build cache**
```bash
# Client
rm -rf client/dist
rm -rf node_modules/.vite

# Server (if applicable)
rm -rf node_modules/.cache
```

---

## 📊 Debug Mode

### Enable detailed logging

**Client Debug**:
```javascript
// Add to client/src/App.jsx before return
if (process.env.NODE_ENV !== 'production') {
  console.log('Current user:', user);
  console.log('Current location:', location.pathname);
}
```

**Server Debug**:
```bash
# Set environment variable
NODE_ENV=development npm run dev

# All requests will be logged with morgan
```

### Browser DevTools

**Essential tabs**:
1. **Network** - Check API responses (should be 200/201)
2. **Console** - Check for JavaScript errors
3. **Application** - Check localStorage for token
4. **Sources** - Set breakpoints to debug

**Check API responses**:
```javascript
// In console
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
  // Should show: {status: "OK", project: "Sishu Arogaya"}
```

---

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No API keys in version control
- [ ] `JWT_SECRET` is strong (not the default)
- [ ] Database credentials secured
- [ ] HTTPS enabled in production
- [ ] CORS is restricted to trusted domains

---

## 📞 Getting More Help

If issues persist:

1. **Check logs carefully**:
   - Server logs in backend terminal
   - Browser console (F12)
   - Network tab in DevTools

2. **Verify configuration**:
   - `.env` file exists and is readable
   - All ports are free
   - MongoDB is running

3. **Try full reset**:
   ```bash
   # Stop both services (Ctrl+C)
   
   # Clear everything
   rm -rf client/node_modules server/node_modules
   rm -rf client/dist
   
   # Reinstall
   cd client && npm install
   cd ../server && npm install
   
   # Restart
   npm run dev
   ```

4. **Check system requirements**:
   - Node.js: v24.14.0 or higher
   - npm: 11.9.0 or higher
   - MongoDB: 4.0 or higher
   - 2GB RAM minimum
   - 500MB free disk space

---

## 🎯 Performance Tips

**For faster development**:

1. **Use dev mode** (not build):
   ```bash
   npm run dev  # Not: npm run build
   ```

2. **Close DevTools** when not needed (uses more memory)

3. **Use VS Code extensions**:
   - ES7+ React/Redux/React-Native snippets
   - MongoDB for VS Code
   - Thunder Client (REST API testing)

4. **Optimize images**:
   - Compress images before adding to project
   - Use vector formats (SVG) when possible

---

## ✨ Next Steps

Once everything is working:

1. **Seed demo data**:
   ```bash
   cd server
   npm run seed:everything
   ```

2. **Test all user roles**:
   - Parent dashboard
   - ASHA worker dashboard
   - Admin dashboard

3. **Explore features**:
   - Create a child profile
   - Log growth records
   - View vaccination schedules
   - Check government schemes

4. **Customize for production**:
   - Update branding
   - Configure email settings
   - Set up database backups
   - Enable HTTPS

---

**Happy debugging!** 🚀

