// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // 添加 CORS
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const http = require('http');
const { initSocket } = require('./socketServer');

// 讀取你的 openapi.yaml
const swaggerDocument = YAML.load('./openapi.yaml');

// 導入路由
const gameRoute = require('./routes/gameRoute');
const questionRoute = require('./routes/questionRoute');

const app = express();
const server = http.createServer(app); // ✅ 創建 HTTP 伺服器

// ✅ 初始化 Socket.io（要在設定 CORS 之後）
initSocket(server);

// ✅ CORS 設定 - 要在其他 middleware 之前
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 中間件
app.use(bodyParser.json());

// 設定 Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 靜態文件服務（用於圖片）
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// MongoDB 連接
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('已連接到 MongoDB'))
  .catch(err => console.error('MongoDB 連接錯誤:', err));

// 根路由
app.get('/', (req, res) => res.send('動漫猜謎遊戲 API 正在運行'));

// 註冊路由
app.use('/api/games', gameRoute);
app.use('/api', questionRoute);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '內部伺服器錯誤',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ 啟動伺服器 - 使用 server.listen 而不是 app.listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`伺服器運行在端口 ${PORT}`);
  console.log(`Swagger 文檔: http://localhost:${PORT}/api-docs`);
});

// ✅ 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('HTTP 伺服器已關閉');
    mongoose.connection.close(() => {
      console.log('MongoDB 連接已關閉');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('HTTP 伺服器已關閉');
    mongoose.connection.close(() => {
      console.log('MongoDB 連接已關閉');
      process.exit(0);
    });
  });
});