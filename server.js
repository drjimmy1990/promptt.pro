import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Gzip compression
app.use(compression());

// Serve static files from dist/
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true,
}));

// SPA fallback — all routes go to index.html (for React Router)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Prompt Generator running on port ${PORT}`);
});
