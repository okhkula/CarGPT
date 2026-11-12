# CarGPT

An AI-powered personal car assistant and beginner-friendly virtual driving instructor. CarGPT explains cars in plain language for new drivers, first-time owners and enthusiasts.

## Features

- **Home dashboard** with a personal greeting, the main "Ask CarGPT" box, suggested questions, your primary car, maintenance reminders, overdue alerts and a tip of the day.
- **AI chat** (Google Gemini free tier by default) focused on cars and driving, with **Brief** and **Detailed** answer modes, conversation memory, and a polite redirect for off-topic questions. Navigation questions count as driving-related.
- **Photo questions**: attach a picture of a warning light, tire, leak or part. Answers state their uncertainty and never claim a confirmed diagnosis.
- **My Car**: add, edit and remove cars, keep several, set a primary car, and choose which car a chat is about.
- **Brand and model search** backed by the public NHTSA vPIC database, so any brand works without code changes (with a small built-in list as an offline fallback).
- **Dashboard warning-light guide**: meaning, possible causes, what to do and urgency for the ten most common lights.
- **Maintenance reminders** by date and/or mileage, with repeat intervals and overdue / due-soon status.
- **Chat History** with search, rename and delete.
- **Settings**: display name, default answer length, units, light/dark theme, backup and restore.

Cars, reminders, chats and settings are stored in the browser (localStorage). Only chat messages and attached photos are sent to the server, which forwards them to the AI provider.

## Project structure

```
index.html          App shell
assets/app.js       Views, routing and events (no framework, no build step)
assets/store.js     Saved data and reminder logic
assets/data.js      Warning lights, tips, maintenance types, fallback car list
assets/styles.css   Styles (light and dark)
api/chat.js         Serverless function: builds the CarGPT prompt and streams the AI reply
api/vehicles.js     Serverless function: car brands and models
dev-server.js       Local development server
```

## Run locally

Requires Node.js 18 or newer. There are no dependencies to install.

```bash
GEMINI_API_KEY=your-key npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

1. Import this repository in Vercel (framework preset: **Other**, no build command).
2. Create a free Gemini API key at https://aistudio.google.com/apikey (no card needed).
3. In **Project > Settings > Environment Variables**, add `GEMINI_API_KEY`.
4. Redeploy.

The default model is `gemini-3.8-flash`, with other free Flash models as fallbacks. Set `AI_MODEL` to choose a different one. The free tier is rate-limited, and Google may use free-tier content to improve its products.

To use OpenAI instead (paid), set `OPENAI_API_KEY` and leave `GEMINI_API_KEY` unset.

## Safety

CarGPT gives general guidance and cannot inspect a vehicle. Have a qualified mechanic confirm anything safety-related.
