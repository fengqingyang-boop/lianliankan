const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const PORT = 8080;
const MAX_PORT_TRIES = 10;

// 检查端口是否被占用
function checkPort(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                reject(err);
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        
        server.listen(port);
    });
}

// 找到可用端口
async function findAvailablePort(startPort) {
    for (let i = 0; i < MAX_PORT_TRIES; i++) {
        const port = startPort + i;
        const isAvailable = await checkPort(port);
        if (isAvailable) {
            return port;
        }
        console.log(`端口 ${port} 已被占用，尝试下一个端口...`);
    }
    throw new Error(`无法找到可用端口，尝试了 ${MAX_PORT_TRIES} 个端口`);
}

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 启动服务器
async function startServer() {
    try {
        const availablePort = await findAvailablePort(PORT);
        
        const server = http.createServer((req, res) => {
            let filePath = '.' + req.url;
            if (filePath === './') {
                filePath = './index.html';
            }
            
            const extname = path.extname(filePath);
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(404);
                        res.end('文件未找到');
                    } else {
                        res.writeHead(500);
                        res.end('服务器错误: ' + error.code);
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        });
        
        server.listen(availablePort, () => {
            console.log(`\n✅ 服务器已启动！`);
            console.log(`🌐 访问地址: http://localhost:${availablePort}`);
            console.log(`🎮 游戏已准备就绪，在浏览器中打开上述地址即可开始游戏！`);
            console.log(`\n📋 游戏说明:`);
            console.log(`   - 8x8 的水果连连看游戏`);
            console.log(`   - 共 5 关，每关 60 秒`);
            console.log(`   - 点击两个相同的水果进行消除`);
            console.log(`   - 两个水果之间的连接不能超过两个拐弯`);
            console.log(`   - 点击"提示"按钮可获得帮助`);
        });
        
    } catch (error) {
        console.error('❌ 启动服务器失败:', error.message);
        process.exit(1);
    }
}

// 启动服务器
startServer();