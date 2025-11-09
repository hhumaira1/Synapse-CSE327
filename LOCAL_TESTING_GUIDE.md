# 🧪 Local Testing Guide - Twilio VoIP

## ✅ Prerequisites Check

Your Twilio credentials are already configured in `server/.env`:
- ✅ Account SID: `AC1d17c2feabd9d26b85d0ac6ca6941de1`
- ✅ Auth Token: Configured
- ✅ API Key SID: `SKf686247834a94b425536968b7b657514`
- ✅ Phone Number: `+17085547043` (Fixed format)
- ✅ TwiML App SID: `AP9fa0f8f269e1c3e192b2405ba7d784dc`

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Start Backend**
```powershell
cd server
npm run start:dev
```
Wait until you see: `🚀 Backend running on http://localhost:3001/api`

### **Step 2: Start Frontend**
Open a **new terminal**:
```powershell
cd Frontend
npm run dev
```
Wait until you see: `✓ Ready in [X]s`

### **Step 3: Access Application**
Open browser: **http://localhost:3000**

1. Sign in with Clerk
2. Click **"Calls"** in sidebar
3. You should see:
   - Dialer on the left
   - Call History on the right

---

## 📞 Testing Basic Outbound Calls (Without Webhooks)

### **Test 1: Call Your Own Phone**
1. On the Calls page, enter YOUR phone number: `+1234567890`
2. Click green **"Call"** button
3. You should receive a call on your phone!
4. **Expected Result**: 
   - Frontend shows "Connecting..." → "Ringing..." → "Active"
   - Your phone rings
   - Answer to test audio

**Note**: Without ngrok, call status updates won't work, but you can still make calls!

### **Test 2: Call from Contacts Page**
1. Go to **"Contacts"** page
2. Find a contact with a phone number
3. Click the **phone icon** button
4. Call should initiate immediately

### **Test 3: Search and Call**
1. On Calls page, type a contact name in search box
2. Select contact from dropdown
3. Phone number auto-fills
4. Click **"Call"**

---

## 🌐 Full Testing with Webhooks (Recommended)

Webhooks enable:
- ✅ Real-time call status updates
- ✅ Call duration tracking
- ✅ Recording URLs
- ✅ Call history updates

### **Install ngrok** (One-time setup)

#### **Option A: Download Installer**
1. Go to https://ngrok.com/download
2. Download Windows version
3. Extract `ngrok.exe` to `C:\ngrok\`
4. Add to PATH or use full path

#### **Option B: Using Chocolatey**
```powershell
choco install ngrok
```

#### **Option C: Using Scoop**
```powershell
scoop install ngrok
```

### **Setup ngrok**

1. **Create free account**: https://dashboard.ngrok.com/signup
2. **Get auth token**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Configure ngrok**:
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### **Start ngrok Tunnel**

Open a **third terminal** (keep backend and frontend running):
```powershell
ngrok http 3001
```

You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### **Configure Twilio Webhooks**

1. Go to **Twilio Console**: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click your phone number: `+1 (708) 554-7043`
3. Scroll to **Voice Configuration**:
   - **A CALL COMES IN**: `Webhook`
   - **URL**: `https://abc123.ngrok-free.app/api/twilio/voice-webhook`
   - **HTTP**: `POST`

4. Scroll to **Call Status Changes**:
   - **URL**: `https://abc123.ngrok-free.app/api/twilio/call-status`
   - **HTTP**: `POST`

5. Click **Save**

### **Configure TwiML App**

1. Go to **TwiML Apps**: https://console.twilio.com/us1/develop/voice/manage/twiml-apps
2. Click your app: `AP9fa0f8f269e1c3e192b2405ba7d784dc`
3. Set **Voice Request URL**:
   - **URL**: `https://abc123.ngrok-free.app/api/twilio/voice-webhook`
   - **HTTP**: `POST`
4. Click **Save**

### **Test with Full Features**

1. Make a call from Calls page
2. You should now see:
   - ✅ Status changes: Connecting → Ringing → In-Progress → Completed
   - ✅ Duration timer updates in real-time
   - ✅ Call appears in Call History with correct duration
   - ✅ Recording URL (if enabled)

---

## 🔍 Troubleshooting

### **Problem 1: "Failed to initialize voice calling"**

**Solution**: Check browser console (F12) for errors
- Ensure backend is running on port 3001
- Verify Twilio credentials in `server/.env`
- Test API endpoint: http://localhost:3001/api/twilio/access-token (should return 401 without auth)

### **Problem 2: "Call failed" or "Invalid phone number"**

**Causes**:
- Phone number format incorrect (must start with `+` and country code)
- Twilio account has geographic restrictions
- Insufficient Twilio account balance

**Solution**:
```javascript
// Valid formats:
+17085547043  ✅
+1-708-554-7043  ❌ (no dashes)
7085547043  ❌ (no country code)
```

Check Twilio balance: https://console.twilio.com/us1/billing/manage-billing/billing-overview

### **Problem 3: "Twilio Device not initialized"**

**Solution**:
- Wait 2-3 seconds after page load (initialization takes time)
- Check that access token endpoint works
- Verify API Key credentials are correct

### **Problem 4: Call status doesn't update**

**Cause**: Webhooks not configured or ngrok tunnel down

**Solution**:
1. Verify ngrok is running and URL hasn't changed
2. Update Twilio webhook URLs if ngrok URL changed
3. Check ngrok web interface: http://127.0.0.1:4040
4. View webhook requests in Twilio Console: https://console.twilio.com/us1/monitor/logs/calls

### **Problem 5: No audio during call**

**Solution**:
- Grant microphone permissions in browser
- Check browser console for getUserMedia errors
- Test in Chrome/Edge (best Twilio support)
- Avoid Firefox in private mode (blocks WebRTC)

### **Problem 6: CORS errors**

**Solution**: Backend already configured with CORS for `http://localhost:3000`

If you still see CORS errors:
1. Check `server/src/main.ts` has `app.enableCors()`
2. Restart backend server
3. Clear browser cache (Ctrl+Shift+Del)

---

## 🎯 Testing Checklist

### **Basic Functionality** (No ngrok needed)
- [ ] Backend starts without errors
- [ ] Frontend loads Calls page
- [ ] Can enter phone number manually
- [ ] Dial pad buttons work
- [ ] Call button initiates call
- [ ] Can receive call on your phone
- [ ] Can hear audio during call
- [ ] Mute button works
- [ ] End call button works

### **Contact Integration**
- [ ] Contact search shows results (tenant-filtered)
- [ ] Can select contact from dropdown
- [ ] Phone number auto-fills
- [ ] Call button works from Contacts page

### **With Webhooks** (ngrok required)
- [ ] Call status changes in real-time
- [ ] Duration timer updates every second
- [ ] Call appears in history immediately
- [ ] Call history shows correct duration
- [ ] Can filter history (all/inbound/outbound)
- [ ] Can call back from history

### **Security (Tenant Isolation)**
- [ ] Contact search only shows my tenant's contacts
- [ ] Call history only shows my tenant's calls
- [ ] Cannot see other tenants' data

---

## 📊 Monitoring & Debugging

### **View Backend Logs**
Watch terminal where `npm run start:dev` is running for:
```
[TwilioService] Twilio service initialized
[TwilioController POST] /api/twilio/make-call
[VoiceService] Creating call log for tenant: xxx
[TwilioService] Call initiated: CA123...
```

### **View Twilio Logs**
https://console.twilio.com/us1/monitor/logs/calls
- See all calls made
- View webhook deliveries
- Check error messages

### **View ngrok Requests**
http://127.0.0.1:4040
- See all webhook requests from Twilio
- Inspect request/response data
- Replay requests for debugging

### **Browser DevTools**
- **Console**: Check for JavaScript errors
- **Network tab**: Verify API calls succeed
- **Application → Local Storage**: Check auth tokens

---

## 🎬 Quick Test Script

Run this in order:

```powershell
# Terminal 1: Start Backend
cd server
npm run start:dev

# Terminal 2: Start Frontend
cd Frontend
npm run dev

# Terminal 3 (Optional): Start ngrok for webhooks
ngrok http 3001

# Browser: http://localhost:3000
# 1. Sign in
# 2. Go to Calls page
# 3. Enter your phone number: +1234567890
# 4. Click Call
# 5. Answer your phone!
```

---

## 💡 Tips for Best Results

1. **Use Chrome or Edge** (best WebRTC support)
2. **Grant microphone permissions** when prompted
3. **Test with your own phone first** (easiest to verify)
4. **Keep ngrok running** (URL changes each restart on free plan)
5. **Watch all 3 terminals** (backend, frontend, ngrok) for errors
6. **Check Twilio Console** for call logs and errors
7. **Use headphones** to prevent echo/feedback

---

## 🆘 Still Having Issues?

### **Check these common issues:**

1. **Twilio Account Status**
   - Verify account is active (not trial expired)
   - Check account balance > $0
   - Verify phone number is active

2. **Geographic Restrictions**
   - Twilio trial accounts may have restrictions
   - Verify you can call the destination country
   - Check: https://console.twilio.com/us1/develop/voice/settings/geo-permissions

3. **Network/Firewall**
   - WebRTC requires UDP ports 10000-20000
   - Some corporate networks block WebRTC
   - Try on mobile hotspot if VPN/proxy is active

4. **Browser Issues**
   - Clear cache and hard reload (Ctrl+Shift+R)
   - Try incognito mode
   - Update browser to latest version

### **Get Help:**
- Backend errors: Check `server` terminal output
- Frontend errors: Check browser console (F12)
- Twilio errors: Check https://console.twilio.com/us1/monitor/logs
- ngrok errors: Check http://127.0.0.1:4040

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Your phone rings within 2-3 seconds of clicking "Call"
- ✅ You can hear audio on both sides
- ✅ Duration timer updates in frontend
- ✅ Call appears in history after ending
- ✅ No errors in browser console or backend logs

**Happy testing! 📞**
