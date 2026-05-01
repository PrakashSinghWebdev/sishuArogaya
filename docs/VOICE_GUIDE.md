# 🎙️ Voice Guide Feature - Setup & Usage

## Overview
The Voice Guide automatically explains every button and feature on the website in Hindi and English. When enabled, it:
- Welcomes users with an intro
- Explains buttons on hover
- Tells what happens on click
- Works with both Hindi and English

---

## ✨ Features

### 1. **Permission Dialog**
- Appears on first visit
- Users can enable/disable voice guidance
- Permission stored in localStorage

### 2. **Auto Intro**
When enabled, the website introduction plays automatically:
- **English:** "Welcome to Shishu Arogya. This is your voice guide..."
- **Hindi:** "शिशु आरोग्य में आपका स्वागत है..."

### 3. **Smart Element Descriptions**
When you hover over or click any button:
- Automatically describes what the button does
- Works in selected language (Hindi/English)
- No extra setup needed for most buttons

### 4. **Voice Toggle**
- 🎙️ button appears in bottom-right
- Click to disable voice guide anytime
- User can re-enable by refreshing page

---

## 🔧 How to Add Custom Descriptions

### Method 1: Using `data-voice-description` Attribute
```jsx
<button data-voice-description="This button saves your child's vaccination record">
  Save Vaccination
</button>
```

### Method 2: Using `aria-label`
```jsx
<button aria-label="Click to view your child's growth chart">
  📈 Growth Chart
</button>
```

### Method 3: Using Class Names
Automatically matches class names with descriptions:
```jsx
<button className="dashboard-btn">Go to Dashboard</button>
// Automatically says: "Dashboard - View your child health overview..."
```

---

## 📝 Built-in Descriptions

The following buttons have pre-built descriptions:

**English:**
- `dashboard` → Dashboard - View your child health overview...
- `vaccination` → Vaccination Schedule - Track vaccinations...
- `growth` → Growth Monitoring - Monitor child development...
- `diet` → Diet Plan - Get personalized diet recommendations...
- `prediction` → AI Health Prediction - Get AI powered health...
- `schemes` → Government Schemes - View welfare schemes...
- `notifications` → Notifications - Check alerts and reminders...
- `settings` → Settings - Manage account and preferences...
- `logout` → Logout - Sign out from account...
- `profile` → Profile - View and edit child profile...
- `language` → Language - Change website language...
- `search` → Search - Find information quickly...

**Hindi:**
- `dashboard` → डैशबोर्ड - अपने बच्चे के स्वास्थ्य का अवलोकन...
- `vaccination` → टीकाकरण समय सूची - अपने बच्चे के टीकाकरण...
- *(और बहुत कुछ...)*

---

## 🚀 Implementation Examples

### Example 1: Simple Button
```jsx
<button 
  onClick={handleDashboard}
  data-voice-description="Go to home dashboard to see health overview"
>
  🏠 Dashboard
</button>
```

### Example 2: Link with aria-label
```jsx
<Link 
  to="/parent/vaccination"
  aria-label="Navigate to vaccination schedule page"
>
  📅 Vaccinations
</Link>
```

### Example 3: Using Class
```jsx
<button className="vaccination-btn growth-btn">
  View Records
</button>
// Uses "vaccination" description from list
```

---

## 📊 Testing the Feature

### Test Checklist:
1. ✅ Open website
2. ✅ See permission modal
3. ✅ Click "Yes, Enable" (or "हाँ, सक्षम करें")
4. ✅ Hear intro in selected language
5. ✅ Hover over dashboard button
6. ✅ Hear description of what button does
7. ✅ Click different buttons
8. ✅ Voice guides change with language selection

---

## 🔗 Integration with Components

### Parent Dashboard (Dashboard.jsx)
Add to main buttons:
```jsx
<button 
  className="dashboard-btn"
  data-voice-description="Click to record your child's new growth measurements"
>
  📏 Record Growth
</button>
```

### ASHA Dashboard (Dashboard.jsx)
```jsx
<button 
  className="search-btn"
  data-voice-description="Search for a child by their unique ID or name"
>
  🔍 Find Child
</button>
```

### Vaccination Tracker
```jsx
<button 
  className="vaccination-btn"
  data-voice-description="Check if any vaccinations are overdue for your child"
>
  ⏰ Check Overdue
</button>
```

---

## 🎯 Best Practices

1. **Be Descriptive** - Explain what will happen when user clicks
   - ❌ Bad: "Button"
   - ✅ Good: "Click to save your child's vaccination record"

2. **Include Action** - Start with action verb when possible
   - ✅ "View your child's growth chart"
   - ✅ "Record a new measurement"
   - ✅ "Download health report as PDF"

3. **Keep it Short** - Keep descriptions 5-15 words
   - ❌ "This button is used to navigate to the section where you can view, manage, and track all the vaccinations..."
   - ✅ "View and manage vaccination schedule"

4. **Support Both Languages** - Use language context:
   ```jsx
   const { lang } = useLanguage();
   const description = lang === 'hi' 
     ? 'अपने बच्चे की वैक्सीन रिकॉर्ड सहेजें'
     : 'Save your child vaccination record';
   ```

---

## 🎨 Customization

### Change Intro Message
Edit `VoiceGuide.jsx`:
```javascript
const INTRO_MESSAGES = {
  en: "Your custom intro message here...",
  hi: "आपका कस्टम परिचय संदेश यहाँ...",
};
```

### Add More Descriptions
Edit `ELEMENT_DESCRIPTIONS` object in `VoiceGuide.jsx`:
```javascript
const ELEMENT_DESCRIPTIONS = {
  en: {
    'diet': 'Diet Plan - Your custom description here...',
  },
  hi: {
    'diet': 'आहार योजना - आपका कस्टम विवरण यहाँ...',
  },
};
```

### Change Voice Speed
Edit in `VoiceGuide.jsx`:
```javascript
utterance.rate = 0.95;  // Change to 0.8 (slower) or 1.2 (faster)
```

---

## 🐛 Troubleshooting

### Voice not playing?
- Check browser volume
- Make sure browser supports Web Speech API (Chrome, Edge, Firefox)
- Check browser console for errors

### Description not showing?
- Verify `data-voice-description` attribute is added
- Check spelling of class names
- Make sure element is actually a button, link, or `[role="button"]`

### Permission dialog not appearing?
- Clear localStorage: Open DevTools → Storage → LocalStorage → Remove `voice_guide_asked`
- Refresh page

### Wrong language?
- Change language in settings
- Voice Guide uses the selected language automatically

---

## 📱 Browser Support

✅ **Supported:**
- Chrome/Chromium
- Edge
- Firefox
- Safari (iOS 14.5+)

⚠️ **Limited Support:**
- Safari on Mac (may need additional setup)

---

## 📞 Future Enhancements

Potential improvements:
- [ ] Settings to customize voice speed/pitch
- [ ] Option to turn off intro
- [ ] Keyboard shortcut to toggle voice guide
- [ ] Detailed walkthrough for new users
- [ ] Voice commands to navigate
- [ ] Save user preferences in database

---

**Last Updated:** 2026-05-01
**Status:** ✅ Ready to Use
