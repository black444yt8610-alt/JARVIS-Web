# JARVIS Web

A mobile-first, voice-first JARVIS interface designed for GitHub Pages.

## Included
- Browser speech recognition when supported
- Browser text-to-speech
- Text conversation UI
- Local persistent memory using `localStorage`
- Deterministic local agent tools: time, date, help, remember, recall
- Optional secure AI backend endpoint
- PWA manifest
- GitHub Pages-ready static files

## Deploy on GitHub Pages
1. Upload these files to the root of your repository.
2. In GitHub, open **Settings → Pages**.
3. Choose **GitHub Actions** as the source.
4. Add the workflow in `.github/workflows/pages.yml` from this project.
5. Your project site will be available at the GitHub Pages project URL.

## Security
This frontend is public. **Never put a Gemini, OpenAI, Groq, or other private API key in these files.** Use a server-side backend if you want model inference.

## Memory
Local memory is stored in this browser/device. It is not uploaded to GitHub and is not shared across devices.
