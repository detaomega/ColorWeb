import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  username: string;
  score: number;
}

interface Props {
  gameId: string;
}

let socket: Socket;

const PlayerList: React.FC<Props> = ({ gameId }) => {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
    gameId = "VR5TELH2";
  useEffect(() => {
    // 創建 socket 連接時指定更多選項
    socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'], // 指定傳輸方式
      withCredentials: true, // 如果需要認證
      forceNew: true, // 強制新連接
      timeout: 5000 // 連接超時時間
    });

    // 監聽連接狀態
    socket.on('connect', () => {
      console.log('Socket 已連接:', socket.id);
      setConnected(true);
      setError('');
      
      // 如果已經加入遊戲，重新請求玩家列表
      if (joined) {
        console.log('重新連接後請求玩家列表');
        socket.emit('request-room-players', { gameId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket 已斷線');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket 連接錯誤:', error);
      setError(`連接失敗: ${error.message}`);
      setConnected(false);
    });

    socket.on('player-joined', (newPlayer: Player) => {
      console.log('新玩家加入:', newPlayer);
      setPlayers((prev) => {
        const exists = prev.some((p) => p.username === newPlayer.username);
        return exists ? prev : [...prev, newPlayer];
      });
    });

    socket.on('player-left', (username: string) => {
      console.log('玩家離開:', username);
      setPlayers((prev) => {
        const updatedPlayers = prev.filter((p) => p.username !== username);
        console.log('更新後的玩家列表:', updatedPlayers);
        return updatedPlayers;
      });
    });

    // 處理現有玩家列表（當新玩家加入時獲取房間內現有玩家）
    socket.on('existing-players', (existingPlayers: Player[]) => {
      console.log('收到現有玩家列表:', existingPlayers);
      setPlayers((prev) => {
        // 避免重複添加玩家
        const newPlayers = [...prev];
        existingPlayers.forEach(player => {
          if (!newPlayers.some(p => p.username === player.username)) {
            newPlayers.push(player);
          }
        });
        console.log('合併後的玩家列表:', newPlayers);
        return newPlayers;
      });
    });

    // 處理房間完整玩家列表（用於同步所有玩家）
    socket.on('room-players', (allPlayers: Player[]) => {
      console.log('收到房間完整玩家列表:', allPlayers);
      setPlayers(allPlayers);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleJoin = async () => {
    if (!username.trim()) {
      setError('請輸入暱稱');
      return;
    }

    if (!connected) {
      setError('Socket 尚未連接，請稍候再試');
      return;
    }

    try {
      // 確保使用正確的 gameId
      const res = await fetch(`/api/games/${gameId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '加入失敗');

      setJoined(true);
      setError('');
      
      // 發送加入房間事件，後端會處理玩家列表同步
      socket.emit('join-game', { gameId, username });
      
      console.log('已發送 join-game 事件');
    } catch (err: any) {
      console.error('加入遊戲失敗:', err);
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: '20px' }}>
      {/* 連接狀態指示器 */}
      <div style={{ 
        marginBottom: '10px', 
        padding: '5px', 
        backgroundColor: connected ? '#d4edda' : '#f8d7da',
        color: connected ? '#155724' : '#721c24',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Socket 狀態: {connected ? '已連接' : '未連接'}
      </div>

      {!joined ? (
        <>
          <h2>加入遊戲房間 ({gameId})</h2>
          <input
            type="text"
            placeholder="輸入暱稱"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button 
            onClick={handleJoin} 
            disabled={!connected}
            style={{ 
              width: '100%',
              padding: '10px',
              backgroundColor: connected ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: connected ? 'pointer' : 'not-allowed'
            }}
          >
            {connected ? '加入遊戲' : '等待連接...'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </>
      ) : (
        <>
          <h2>玩家列表 ({players.length} 人)</h2>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            你的暱稱: {username}
          </div>
          
          {/* 除錯信息 */}
          <details style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
            <summary>除錯信息</summary>
            <div>Socket ID: {socket?.id}</div>
            <div>房間 ID: {gameId}</div>
            <div>連接狀態: {connected ? '已連接' : '未連接'}</div>
            <div>玩家數據: {JSON.stringify(players)}</div>
          </details>
          
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((player) => (
              <li 
                key={player.username}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: player.username === username ? '#e7f3ff' : '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                {player.username}（分數: {player.score}）
                {player.username === username && <span style={{ color: '#007bff' }}> (你)</span>}
              </li>
            ))}
          </ul>
          {players.length === 0 && (
            <div>
              <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                載入玩家列表中...
              </p>
              <button 
                onClick={() => {
                  console.log('手動請求玩家列表');
                  socket.emit('request-room-players', { gameId });
                }}
                style={{ 
                  padding: '5px 10px', 
                  fontSize: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                重新載入玩家列表
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerList;