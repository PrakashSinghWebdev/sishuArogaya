# 🔧 Login Failed - Troubleshooting Guide

## ❌ Error: "Login failed. Please try again."

This usually happens due to one of these issues:

---

## ✅ STEP 1: Verify Servers Are Running

### Check Backend Server
```bash
# Should see:
# [dotenv] injecting env...
# Sishu Arogaya server running on port 5000
# MongoDB connected: localhost

curl http://localhost:5000/api/health
# Should return: {"status":"OK","project":"Sishu Arogaya"}
```

### Check Frontend Server
```bash
# Should see:
# ✓ ready in XXXms
# → Local: http://localhost:5175
```

### If NOT running:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## ✅ STEP 2: Verify Demo Users Exist

Run this command to create demo users:

```bash
cd server
npm run seed
```

**Expected output:**
```
[skip] admin@sishu.gov.in already exists
[skip] asha@sishu.gov.in already exists
[skip] parent@sishu.gov.in already exists
```

---

## ✅ STEP 3: Check MongoDB Connection

**Make sure MongoDB is running:**

```bash
# Windows - Check if MongoDB is running
tasklist | findstr mongod

# Mac
brew services list | grep mongodb

# Linux
systemctl status mongod
```

**If NOT running, start it:**

```bash
# Windows
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Verify connection:**
```bash
# Test MongoDB
mongosh --eval "db.adminCommand('ping')"
# Should return: { ok: 1 }
```

---

## ✅ STEP 4: Clear Browser Cache & Try Again

```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Paste this:
localStorage.clear();
sessionStorage.clear();

// Then refresh page (Ctrl+R or Cmd+R)
```

---

## ✅ STEP 5: Check Browser Console for Errors

1. Open **DevTools** (F12)
2. Go to **Console** tab
3. Look for red error messages
4. Go to **Network** tab
5. Try to login
6. Look for failed API calls

**What to look for:**
- ❌ 401 Unauthorized → Wrong password
- ❌ 404 Not Found → API endpoint missing
- ❌ 500 Server Error → Backend error
- ❌ CORS Error → Connection issue

---

## ✅ STEP 6: Test Login Manually via API

Open a command prompt and test:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"parent@sishu.gov.in\",\"password\":\"Parent@123\",\"role\":\"parent\"}"
```

**Expected response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Ramesh Kumar (Parent)",
    "email": "parent@sishu.gov.in",
    "role": "parent"
  }
}
```

---

## 📋 Common Issues & Fixes

### Issue 1: "Port 5000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue 2: "MongoDB connection error"

**Fix:**
```bash
# Start MongoDB
mongod

# Or change port in server/.env
MONGO_URI=mongodb://localhost:27017/sishuarogaya
```

### Issue 3: "CORS error" or "Network Error"

**Fix:** Make sure:
1. Backend is running on port 5000
2. Frontend proxy is configured correctly
3. Check `client/vite.config.js` has:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

### Issue 4: "Invalid credentials" (401)

**Fix:** Try these credentials:

| Role | Email | Password |
|------|-------|----------|
| Parent | parent@sishu.gov.in | Parent@123 |
| ASHA | asha@sishu.gov.in | Asha@123 |
| Admin | admin@sishu.gov.in | Admin@123 |

Make sure passwords are EXACTLY as shown (case-sensitive!)

### Issue 5: "This account is registered as..."

**Fix:** Select the correct role on login page:
- If using `parent@sishu.gov.in` → Select **"Parent"**
- If using `asha@sishu.gov.in` → Select **"ASHA Worker"**
- If using `admin@sishu.gov.in` → Select **"Admin"**

---

## 🚀 Complete Restart Procedure

If all else fails, do a complete restart:

```bash
# 1. Stop all servers (Ctrl+C in both terminals)

# 2. Kill any lingering processes
taskkill /F /IM node.exe   # Windows
killall node                # Mac/Linux

# 3. Clear caches
rm -rf client/node_modules/.vite
rm -rf server/node_modules

# 4. Restart MongoDB
mongod

# 5. In Terminal 1 - Backend
cd server
npm run dev

# 6. In Terminal 2 - Frontend
cd client
npm run dev

# 7. Wait 5 seconds for servers to fully start

# 8. Go to http://localhost:5175/login

# 9. Try login again with:
#    Email: parent@sishu.gov.in
#    Password: Parent@123
#    Role: Parent
```

---

## 🆘 Still Having Issues?

### Check Server Logs
Look at the backend terminal for error messages like:
- `JWT_SECRET undefined` → Check server/.env
- `MongoError` → MongoDB not running
- `EADDRINUSE` → Port already in use

### Check Client Logs
Open DevTools (F12) and look for:
- Network errors (400, 401, 500)
- CORS errors
- API timeout errors

### Verify .env File
```bash
# server/.env should have:
MONGO_URI=mongodb://localhost:27017/sishuarogaya
JWT_SECRET=sishu-arogaya-super-secret-key-2024
NODE_ENV=development
CLIENT_URL=http://localhost:5175
```

### Reset Database
```bash
# Delete and recreate demo users
cd server
npm run seed
```

---

## ✅ Success Indicators

When login is working, you should see:
1. ✅ No error message
2. ✅ Dashboard loads
3. ✅ User name shows in top right
4. ✅ Navigation menu appears

---

## 📞 Checklist

- [ ] Backend server running (`npm run dev` in server folder)
- [ ] Frontend server running (`npm run dev` in client folder)
- [ ] MongoDB is running
- [ ] Demo users created (`npm run seed`)
- [ ] Browser cache cleared
- [ ] Correct credentials used
- [ ] Correct role selected on login page
- [ ] No firewall blocking ports 5000/5175
- [ ] server/.env has all required variables
- [ ] client/vite.config.js has correct proxy

---

If you've checked all these and it still doesn't work, the issue is likely:
1. Backend not actually running
2. MongoDB not connected
3. Network/firewall issue

**Double-check that both servers show "running" or "ready" messages!**
