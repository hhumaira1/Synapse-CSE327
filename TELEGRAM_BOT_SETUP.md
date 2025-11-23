# 🤖 Telegram Bot Setup Guide

## ✅ Implementation Complete!

All backend and frontend code is ready. Follow these steps to activate your Telegram bot:

---

## 📋 Step 1: Create Your Telegram Bot

1. **Open Telegram** (mobile or desktop)
2. **Search for** `@BotFather`
3. **Send command**: `/newbot`
4. **Follow prompts**:
   - Enter bot name: `SynapseCRM Bot` (or your preferred name)
   - Enter username: `synapse_crm_bot` (must end with `bot`)
5. **Copy the token** you receive (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

---

## 🔑 Step 2: Update Environment Variables

Edit `server/.env`:

```env
# TELEGRAM BOT CONFIGURATION
TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"  # Paste your token here
TELEGRAM_BOT_USERNAME="synapse_crm_bot"  # Without @
```

---

## 🚀 Step 3: Start the Backend

```powershell
cd server
npm run start:dev
```

**Expected output**:
```
[TelegramService] Telegram bot successfully started!
```

---

## 🌐 Step 4: Access Integration Page

1. Open your web app: `http://localhost:3000`
2. Navigate to **Settings → Integrations**
3. Click **"Connect Telegram Bot"**
4. Your Telegram app will open automatically
5. Tap **"SEND"** to link your account

---

## ✨ Step 5: Start Chatting!

Open Telegram and chat naturally:

```
You: show me my contacts
Bot: [Lists your contacts]

You: create a deal for john smith worth $5000
Bot: ✅ Deal created successfully!

You: what tickets are open?
Bot: You have 3 open tickets...

You: show me revenue this month
Bot: 💰 Revenue this month: $45,230
```

**No commands needed!** Just talk naturally like the web chatbot.

---

## 🎯 Features Implemented

### ✅ Backend (`server/src/telegram/`)
- **TelegramAuthService**: One-time code generation, account linking
- **TelegramService**: Natural language processing, ChatbotService integration
- **TelegramController**: Deep link API (`/telegram/generate-link`, `/telegram/status`)
- **Database Models**: `TelegramUser`, `TelegramLinkRequest`

### ✅ Frontend (`Frontend/src/app/(dashboard)/settings/integrations/`)
- **Integration Settings Page**: One-click Telegram connection
- **Deep Link Flow**: Auto-opens Telegram app
- **Status Polling**: Real-time connection status
- **Disconnect Option**: Unlink Telegram account

### ✅ AI Integration
- **Same ChatbotService**: Uses identical AI tools as web chatbot
- **20 AI Tools**: Full CRUD for contacts, deals, leads, tickets + analytics
- **Fuzzy Matching**: Entity resolution for contact names
- **Conversation History**: Saved in database
- **Suggested Actions**: Inline keyboard buttons

---

## 🔧 Troubleshooting

### Bot doesn't start?
- Check `TELEGRAM_BOT_TOKEN` in `.env`
- Ensure token is valid (test with `@BotFather`)
- Restart backend: `npm run start:dev`

### Telegram app doesn't open?
- Try copying the deep link manually from browser console
- Format: `tg://resolve?domain=YOUR_BOT&start=CODE`

### "Account already linked" error?
- Disconnect old link: Settings → Integrations → Disconnect
- Or use Telegram command: `/start new_code`

### Backend errors?
```powershell
# Regenerate Prisma client
cd server
npx prisma generate

# Check database
npx prisma studio
```

---

## 🎨 Customization Options

### Change Bot Welcome Message
Edit `telegram.service.ts` → `bot.start()` handler

### Add Custom Commands
```typescript
bot.command('help', (ctx) => {
  ctx.reply('Available natural language queries...');
});
```

### Format Responses Differently
Edit `formatResponse()` method in `telegram.service.ts`

### Add Webhooks (Production)
For deployment, switch from polling to webhooks:
```typescript
app.post('/telegram/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});
```

---

## 📊 Testing Checklist

- [ ] Backend starts without errors
- [ ] Telegram bot shows "Online" status
- [ ] Deep link opens Telegram app
- [ ] `/start CODE` links account successfully
- [ ] Natural language query works: "show me my contacts"
- [ ] CRUD operations work: "create a deal"
- [ ] Suggested actions appear as inline buttons
- [ ] Multiple tenants isolated (User A can't see User B's data)

---

## 🎉 Next Steps

1. **Get your bot token** from @BotFather
2. **Update `.env`** with token and username
3. **Restart backend**: `npm run start:dev`
4. **Test the integration** by linking your account
5. **Chat naturally** - no commands needed!

---

## 📝 Architecture Summary

```
User sends message in Telegram
    ↓
TelegramService receives text
    ↓
TelegramAuthService authenticates user
    ↓
ChatbotService.chat() processes query ← SAME AS WEB!
    ↓
Gemini AI + 20 CRM tools execute
    ↓
TelegramService formats response
    ↓
User receives reply in Telegram
```

**Key Point**: The bot uses the **exact same backend** as your web chatbot. Zero duplication!

---

**Status**: ✅ Ready to deploy
**Time to setup**: 5 minutes
**Dependencies**: ✅ Already installed (telegraf)
**Database**: ✅ Schema updated and pushed

**Let's get your bot running!** 🚀
