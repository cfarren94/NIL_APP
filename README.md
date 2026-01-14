# CCIE Security Quiz (Single Question Bank)

This is a lightweight, GitHub Pages friendly quiz app that loads a single `questions.json` file.

## Files
- `index.html` – app UI
- `styles.css` – styling
- `app.js` – logic (supports multi-answer via `choose` + `answer`)
- `questions.json` – question bank (array of objects)
- `manifest.json`, `sw.js` – optional PWA/offline support
- `icon-192.png`, `icon-512.png` – app icons

## Deploy on GitHub Pages
1. Create a new GitHub repo and upload all files in this folder.
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **root**
5. Wait for the Pages URL, then open it.

## Question format
Each question looks like:

```json
{
  "id": 1,
  "domain": "",
  "question": "Your question text…",
  "options": { "A": "Option A", "B": "Option B" },
  "choose": 1,
  "answer": ["A"]
}
```

- For “choose two/three”: set `choose` to 2/3 and provide multiple letters in `answer`.
- If you know the domain later, fill in `domain` (the app will show `Domain: <value>`).
