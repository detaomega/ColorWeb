// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// 讀取你的 openapi.yaml
const swaggerDocument = YAML.load('./openapi.yaml');

// 導入路由
const gameRoute = require('./routes/gameroute');
const questionRoute = require('./routes/questionroute');

const app = express();

// 設定 Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 中間件
app.use(bodyParser.json());

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

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行在端口 ${PORT}`);
});