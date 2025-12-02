# Instructions for .env.local

Add these environment variables to your `.env.local` file:

```env
# Gemini API Key for chatbot
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyD9spwzEqYe_qHZQS88PUVtJtLWlY-u4mM

# MCP Server URL
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:5000

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**NEXT.JS REQUIREMENT:** All client-side environment variables must start with `NEXT_PUBLIC_`

After adding these, restart the dev server:
```bash
npm run dev
```
