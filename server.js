import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const iappDir = path.join(__dirname, 'IAPP');

// Case-insensitive file serving helper for robustness
function serveCaseInsensitive(baseDir) {
  return (req, res, next) => {
    const decodedUrl = decodeURIComponent(req.path);
    const requestedPath = path.join(baseDir, decodedUrl);

    // If file exists directly, pass to next middleware (express.static will serve it)
    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
      return next();
    }

    // Attempt case-insensitive lookup
    const segments = decodedUrl.split('/').filter(Boolean);
    let currentDir = baseDir;
    let found = true;

    for (const segment of segments) {
      if (!fs.existsSync(currentDir) || !fs.statSync(currentDir).isDirectory()) {
        found = false;
        break;
      }
      const files = fs.readdirSync(currentDir);
      const match = files.find(f => f.toLowerCase() === segment.toLowerCase());
      if (match) {
        currentDir = path.join(currentDir, match);
      } else {
        found = false;
        break;
      }
    }

    if (found && fs.existsSync(currentDir) && fs.statSync(currentDir).isFile()) {
      return res.sendFile(currentDir);
    }

    next();
  };
}

// Case-insensitive middleware for assets
app.use(serveCaseInsensitive(iappDir));

// Serve static assets from IAPP directory
app.use(express.static(iappDir));
app.use('/IAPP', express.static(iappDir));

// Serve Firebase configuration
app.get('/firebase-applet-config.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'firebase-applet-config.json'));
});
app.get('/IAPP/firebase-applet-config.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'firebase-applet-config.json'));
});

// Landing page route
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(iappDir, 'UnitedClub.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
