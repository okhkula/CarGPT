// Local development server: serves the static app and runs the /api functions.
// Usage: OPENAI_API_KEY=sk-... npm run dev   then open http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/chat') return require('./api/chat.js')(req, res);
    if (url.pathname === '/api/vehicles') return require('./api/vehicles.js')(req, res);
    let file = path.normalize(path.join(root, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!file.startsWith(root) || file.includes(`${path.sep}api${path.sep}`)) file = path.join(root, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) {
        res.statusCode = 404;
        return res.end('Not found');
      }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  })
  .listen(process.env.PORT || 3000, () => console.log(`CarGPT running at http://localhost:${process.env.PORT || 3000}`));
