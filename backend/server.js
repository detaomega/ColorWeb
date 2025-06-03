// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// 讀取你的 openapi.yaml
const swaggerDocument = YAML.load('./openapi.yaml');

// 導入路由
const gameRoute = require('./routes/gameRoute');
const questionRoute = require('./routes/questionRoute');

const app = express();

// 設定 Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 中間件
app.use(bodyParser.json());

// 靜態文件服務（用於圖片）- 更新路徑以支援動漫圖片資料夾
app.use('/images', express.static(path.join(__dirname, 'create_data/dataset')));

// MongoDB 連接
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('已連接到 MongoDB'))
  .catch(err => console.error('MongoDB 連接錯誤:', err));

// 根路由
app.get('/', (req, res) => res.send('動漫猜謎遊戲 API 正在運行'));

// 健康檢查路由 - 檢查動漫資料是否正常載入
app.get('/health', (req, res) => {
  try {
    const fs = require('fs');
    const animeDataPath = path.join(__dirname, 'anime_path.json');
    
    if (!fs.existsSync(animeDataPath)) {
      return res.status(500).json({
        success: false,
        message: '動漫資料檔案不存在'
      });
    }
    
    const animeData = JSON.parse(fs.readFileSync(animeDataPath, 'utf8'));
    const animeCount = Object.keys(animeData).length;
    
    res.status(200).json({
      success: true,
      message: 'API 運行正常',
      animeCount: animeCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '健康檢查失敗',
      error: error.message
    });
  }
});

// 註冊路由
app.use('/api/games', gameRoute);
app.use('/api', questionRoute);
app.get('/api/data/*', (req, res) => {
  const dataDir = path.join(__dirname, 'create_data');
  // 取得多層路徑
  const requestedPath = req.params[0];
  const filePath = path.join(dataDir, requestedPath);

  // 防止路徑穿越攻擊
  if (!filePath.startsWith(dataDir)) {
    return res.status(400).send('無效路徑');
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('檔案不存在');
  }
  if (fs.lstatSync(filePath).isDirectory()) {
    return res.status(403).send('禁止瀏覽資料夾');
  }
  res.sendFile(filePath);
});

// 提供 create_data 目錄下的檔案靜態存取
app.use('/data', express.static(path.join(__dirname, 'create_data')));
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`伺服器運行在端口 ${PORT}`);
  console.log(`API 文檔可在 http://localhost:${PORT}/api-docs 查看`);
  console.log(`健康檢查可在 http://localhost:${PORT}/health 查看`);
});