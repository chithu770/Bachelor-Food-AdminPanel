const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = 'C:/Users/asus/Desktop/New App/dist';

console.log('Serving from:', distDir);
console.log('Files:', fs.readdirSync(distDir));

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  
  const filePath = path.join(distDir, urlPath);
  
  console.log('Request:', req.url, '-> File:', filePath);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log('Error:', err.message);
      res.writeHead(404);
      res.end('Not found: ' + filePath);
    } else {
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(5173, '0.0.0.0', () => {
  console.log('Server running on http://localhost:5173');
});