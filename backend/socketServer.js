// socketServer.js
const { Server } = require('socket.io');
let io;

const socketUserMap = new Map(); // socket.id => { username, gameId }

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('一位使用者已連線:', socket.id);

    socket.on('disconnect', async () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const { gameId, username } = userInfo;
        console.log(`使用者 ${username} 正在離開房間 ${gameId}`);
        
        // 先廣播離開事件，再從 Map 中移除
        io.to(gameId).emit('player-left', username);
        console.log(`已廣播玩家 ${username} 離開房間 ${gameId}`);
        
        // 從 socketUserMap 中移除
        socketUserMap.delete(socket.id);

        try {
          // 更新 DB：從該遊戲移除這個玩家
          const Game = require('./db_structures/game');
          const game = await Game.findOne({ gameId });
          if (game) {
            const originalPlayerCount = game.players.length;
            game.players = game.players.filter(p => p.username !== username);
            
            if (game.players.length !== originalPlayerCount) {
              await game.save();
              console.log(`已從資料庫移除玩家 ${username}`);
            }
          }
        } catch (error) {
          console.error('處理玩家離線時發生錯誤:', error);
        }
      }
      console.log('使用者已斷線:', socket.id);
    });

    // 處理錯誤
    socket.on('error', (error) => {
      console.error('Socket 錯誤:', error);
    });

    // 處理玩家請求房間內所有玩家列表
    socket.on('request-room-players', async ({ gameId }) => {
      console.log(`玩家請求房間 ${gameId} 的玩家列表`);
      socket.join(gameId);
      
      try {
        const Game = require('./db_structures/game');
        const game = await Game.findOne({ gameId });
        
        if (game) {
          const allPlayers = game.players.map(p => ({ 
            username: p.username, 
            score: p.score || 0,
            isHost: game.hostId == p.username,
            isReady: true
          }));
          
          io.in(gameId).emit('room-players', allPlayers);
          // socket.emit('room-players', allPlayers);
          console.log(`發送房間 ${gameId} 玩家列表:`, allPlayers);
        } else {
          socket.emit('room-players', []);
          console.log(`房間 ${gameId} 不存在`);
        }
      } catch (error) {
        console.error('獲取房間玩家列表時發生錯誤:', error);
        socket.emit('room-players', []);
      }
    });

    socket.on('request-game-start', async ({ gameId}) => {
      console.log(`玩家請求房間 ${gameId} 開始`);
      io.in(gameId).emit('start-game');
    });
    // 可以添加更多遊戲相關的事件處理
    socket.on('send-answer', ({ gameId, username, answer }) => {
      console.log(`${username} 在房間 ${gameId} 提交答案: ${answer}`);
      // 廣播答案給房間內其他人
      socket.to(gameId).emit('player-answered', { username, answer });
    });

    socket.on('update-score', ({ gameId, username, score }) => {
      console.log(`更新 ${username} 的分數為 ${score}`);
      // 廣播分數更新
      io.to(gameId).emit('score-updated', { username, score });
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io 尚未初始化');
  }
  return io;
}

// 廣播訊息到特定房間的輔助函數
function broadcastToRoom(gameId, event, data) {
  if (io) {
    io.to(gameId).emit(event, data);
  }
}

// 獲取房間內的玩家數量
function getRoomPlayerCount(gameId) {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(gameId);
  return room ? room.size : 0;
}

module.exports = { 
  initSocket, 
  getIo, 
  broadcastToRoom, 
  getRoomPlayerCount 
};