// Um servidor simples que serve o build de produção e redireciona chamadas de API
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuração do servidor
const PORT = 3000;
const BACKEND_PORT = 3001;
const BACKEND_HOST = '127.0.0.1'; // Usando IP em vez de 'localhost' para maior consistência
const DIST_FOLDER = path.join(__dirname, 'dist');

// Tipos MIME comuns
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Determinar o tipo MIME baseado na extensão do arquivo
function getMimeType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extname] || 'application/octet-stream';
}

// Substituir URLs hardcoded no conteúdo (para JS e HTML)
function replaceHardcodedUrls(content, contentType) {
  // Só processar arquivos JavaScript e HTML
  if (contentType === 'text/javascript' || contentType === 'text/html') {
    let contentStr = content.toString('utf-8');
    
    // Substituir URLs hardcoded por URLs relativas em arquivos JS
    if (contentType === 'text/javascript') {
      contentStr = contentStr.replace(/['"](http|https):\/\/localhost:3001\/api\//g, '"/api/');
      contentStr = contentStr.replace(/['"`](http|https):\/\/localhost:3001\//g, '"/'); 
    }
    
    // Adicionar script simples no HTML para reescrever URLs
    if (contentType === 'text/html' && contentStr.includes('<head>')) {
      const interceptScript = `
<script>
// Reescrever URLs hardcoded
console.log('Inicializando interceptador de URLs...');

// Interceptar fetch
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('localhost:3001')) {
    const newUrl = url.replace(/https?:\/\/localhost:3001(\/api\/|\/)/g, '$1');
    console.log('URL interceptado:', url, '->', newUrl);
    return originalFetch(newUrl, options);
  }
  return originalFetch(url, options);
};

// Interceptar XMLHttpRequest
const originalXhrOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  let newUrl = url;
  if (typeof url === 'string' && url.includes('localhost:3001')) {
    newUrl = url.replace(/https?:\/\/localhost:3001(\/api\/|\/)/g, '$1');
    console.log('XHR interceptado:', url, '->', newUrl);
  }
  return originalXhrOpen.call(this, method, newUrl, ...args);
};
</script>
`;
      contentStr = contentStr.replace('<head>', '<head>' + interceptScript);
    }
    
    return Buffer.from(contentStr, 'utf-8');
  }
  return content;
}

// Servir arquivo estático
function serveStaticFile(filePath, response) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Arquivo não encontrado, tentar servir o index.html para rotas SPA
        fs.readFile(path.join(DIST_FOLDER, 'index.html'), (err, content) => {
          if (err) {
            response.writeHead(500);
            response.end('Erro ao carregar index.html');
          } else {
            const contentType = 'text/html';
            const processedContent = replaceHardcodedUrls(content, contentType);
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(processedContent, 'utf-8');
          }
        });
      } else {
        // Outro erro de servidor
        response.writeHead(500);
        response.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      // Sucesso
      const contentType = getMimeType(filePath);
      const processedContent = replaceHardcodedUrls(content, contentType);
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(processedContent, 'utf-8');
    }
  });
}

// Proxy para o backend
function proxyToBackend(req, res) {
  const parsedUrl = url.parse(req.url);
  
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: parsedUrl.path,
    method: req.method,
    headers: req.headers
  };
  
  // Remover o header host para evitar conflitos
  delete options.headers.host;
  
  console.log(`Proxy: ${req.method} ${req.url} -> http://${BACKEND_HOST}:${BACKEND_PORT}${parsedUrl.path}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (e) => {
    console.error(`Erro na conexão com o backend: ${e.message}`);
    res.writeHead(502);
    res.end('Erro ao conectar com o servidor backend');
  });
  
  // Encaminhar o corpo da requisição se houver
  req.pipe(proxyReq);
}

// Criar o servidor HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // Se for uma chamada para a API, redirecionar para o backend
  if (pathname.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }
  
  // Lidar com arquivos estáticos
  let filePath = path.join(DIST_FOLDER, pathname === '/' ? 'index.html' : pathname);
  
  // Verificar se o arquivo existe
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se o arquivo não existe ou é um diretório, tentar servir o index.html (para SPA)
      filePath = path.join(DIST_FOLDER, 'index.html');
    }
    serveStaticFile(filePath, res);
  });
});

// Iniciar o servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Rede: http://192.168.1.3:${PORT}`);
  console.log(`As chamadas de API serão redirecionadas para http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
