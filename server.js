// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

// 導入路由
const gameRoutes = require('./routes/gameRoutes');
const playerRoutes = require('./routes/playerRoutes');

const app = express();

// 中間件
app.use(bodyParser.json());

// MongoDB 連接
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('已連接到 MongoDB'))
  .catch(err => console.error('MongoDB 連接錯誤:', err));

// 根路由
app.get('/', (req, res) => res.send('QA 遊戲 API 正在運行'));

// 註冊路由
app.use('/api/games', gameRoutes);
app.use('/api', playerRoutes);

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服務器運行在端口 ${PORT}`);
});