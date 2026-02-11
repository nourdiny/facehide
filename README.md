# Face Hider

Modern Next.js web app for uploading:
- Face reference image (`face_image`)
- Target image (`target_image`)

The app supports:
- Mock Mode (default ON) using local canvas processing
- Real API mode (`multipart/form-data`) via `https://example.com/api/face-hide`
- JSON base64 or binary image response handling
- Result preview, download, and reset

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
