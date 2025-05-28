import React, { useEffect, useState, useRef } from 'react';

// 定義 API 回應介面
interface APIPlayer {
  username: string;
  score: number;
  rank: number;
  joinedAt?: string;
}

interface APIGameResponse {
  success: boolean;
  game?: {
    gameId: string;
    gameTitle: string;
    status: string;
    players: APIPlayer[];
    currentQuestionNumber: number;
    startedAt: string;
    finishedAt: string | null;
  };
  players?: APIPlayer[];
  rankings?: APIPlayer[];
  message?: string;
  error?: string;
}

// 定義組件使用的資料介面
interface Player {
  id: string;
  name: string;
  score: number;
  avatar: string;
  time: string;
  trend: 'up' | 'down' | 'same';
  rank: number;
}

interface LeaderboardProps {
  gameId: string;
  onContinue?: () => void;
  refreshInterval?: number; // 自動刷新間隔(毫秒)，預設 5 秒
  showRealTime?: boolean; // 是否顯示即時更新
  apiBaseUrl?: string; // API 基礎 URL，預設為 localhost:3000
}

// 生成隨機頭像 URL 的函數
const generateAvatarUrl = (username: string): string => {
  const avatars = [
    'https://i.pinimg.com/474x/2f/ec/a4/2feca4c9330929232091f910dbff7f87.jpg',
    'https://i.pinimg.com/736x/1c/27/c6/1c27c6b4f4776e7ca9da75c5e93a5b4f.jpg',
    'https://i.pinimg.com/736x/3d/cd/4a/3dcd4af5bc9e06d36305984730ab7888.jpg',
    'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png'
  ];
  
  // 根據用戶名生成固定的頭像索引
  const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
  return avatars[index];
};

// 計算遊戲時間的函數
const calculateGameTime = (startedAt: string, finishedAt: string | null): string => {
  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${Math.floor((diffMinutes % 1) * 60).toString().padStart(2, '0')}`;
};

const AnimeQuizLeaderboard: React.FC<LeaderboardProps> = ({ 
  gameId = "a1b2c3d4",
  onContinue,
  refreshInterval = 5000,
  showRealTime = true,
  apiBaseUrl = 'http://localhost:3000'
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [previousRankings, setPreviousRankings] = useState<{[key: string]: number}>({});
  
  const podiumContainerRef = useRef<HTMLDivElement>(null);
  const fireworkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 獲取遊戲資料的函數
  const fetchGameData = async () => {
    try {
      setError(null);
      console.log('Fetching game data for gameId:', gameId);
      console.log('API Base URL:', apiBaseUrl);
      
      // 獲取遊戲資訊和排名資料
      const gameUrl = `${apiBaseUrl}/games/${gameId}`;
      const rankingsUrl = `${apiBaseUrl}/games/${gameId}/rankings`;
      
      console.log('Fetching from URLs:', { gameUrl, rankingsUrl });
      
      const [gameResponse, rankingsResponse] = await Promise.all([
        fetch(gameUrl),
        fetch(rankingsUrl)
      ]);

      console.log('Response statuses:', { 
        game: gameResponse.status, 
        rankings: rankingsResponse.status 
      });

      if (!gameResponse.ok) {
        const errorText = await gameResponse.text();
        console.error('Game API error:', errorText);
        throw new Error(`Failed to fetch game data: ${gameResponse.status} - ${errorText}`);
      }

      if (!rankingsResponse.ok) {
        const errorText = await rankingsResponse.text();
        console.error('Rankings API error:', errorText);
        throw new Error(`Failed to fetch rankings: ${rankingsResponse.status} - ${errorText}`);
      }

      const gameData: APIGameResponse = await gameResponse.json();
      const rankingsData: APIGameResponse = await rankingsResponse.json();

      console.log('API responses:', { gameData, rankingsData });

      if (!gameData.success) {
        throw new Error(gameData.message || gameData.error || 'Game API request failed');
      }

      if (!rankingsData.success) {
        throw new Error(rankingsData.message || rankingsData.error || 'Rankings API request failed');
      }

      // 儲存遊戲資訊
      if (gameData.game) {
        setGameInfo(gameData.game);
        console.log('Game info set:', gameData.game);
      }

      // 處理排名資料 - 優先使用 rankings API 的資料
      const apiPlayers = rankingsData.rankings || gameData.game?.players || [];
      console.log('API Players:', apiPlayers);

      if (!Array.isArray(apiPlayers)) {
        console.error('API Players is not an array:', apiPlayers);
        throw new Error('Invalid player data received from API');
      }

      // 計算趨勢和處理玩家資料
      const newRankings: {[key: string]: number} = {};
      
      const processedPlayers: Player[] = apiPlayers.map((apiPlayer) => {
        const currentRank = apiPlayer.rank || 1;
        const previousRank = previousRankings[apiPlayer.username];
        
        let trend: 'up' | 'down' | 'same' = 'same';
        if (previousRank !== undefined) {
          if (currentRank < previousRank) {
            trend = 'up';
          } else if (currentRank > previousRank) {
            trend = 'down';
          }
        }
        
        newRankings[apiPlayer.username] = currentRank;
        
        return {
          id: apiPlayer.username,
          name: apiPlayer.username,
          score: apiPlayer.score || 0,
          avatar: generateAvatarUrl(apiPlayer.username),
          time: gameInfo ? calculateGameTime(gameInfo.startedAt, gameInfo.finishedAt) : '00:00',
          trend,
          rank: currentRank
        };
      });

      // 按排名排序
      processedPlayers.sort((a, b) => a.rank - b.rank);
      
      console.log('Processed players:', processedPlayers);
      
      setPlayers(processedPlayers);
      setPreviousRankings(newRankings);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching game data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  };

  // 煙火動畫函數
  const createFirework = () => {
    const container = podiumContainerRef.current;
    if (!container) return;

    const firstPlayer = container.querySelector('.first');
    if (!firstPlayer) return;

    const firstAvatar = firstPlayer.querySelector('.player-avatar') as HTMLElement;
    if (!firstAvatar) return;

    const firstRect = firstAvatar.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const centerX = firstRect.left - containerRect.left + firstRect.width / 2;
    const centerY = firstRect.top - containerRect.top + firstRect.height / 2;

    const radius = Math.min(firstRect.width, firstRect.height) * 2;
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;

      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = document.createElement('div');
      particle.className = 'firework';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = color;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;

      container.appendChild(particle);

      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    }
  };

  useEffect(() => {
    // 初始載入資料
    fetchGameData();

    // 設置定期刷新
    if (showRealTime && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchGameData, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [gameId, refreshInterval, showRealTime]);

  useEffect(() => {
    // 只有當有玩家資料且第一名存在時才開始煙火
    if (players.length > 0) {
      // 頁面載入時立即創建煙火
      createFirework();

      // 定期創建煙火
      fireworkIntervalRef.current = setInterval(createFirework, 1000);
    }

    return () => {
      if (fireworkIntervalRef.current) {
        clearInterval(fireworkIntervalRef.current);
      }
    };
  }, [players]);

  // 手動刷新功能
  const handleRefresh = () => {
    setLoading(true);
    fetchGameData();
  };

  // 取得排名樣式
  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return '';
    }
  };

  // 取得趨勢符號
  const getTrendSymbol = (trend: string) => {
    switch (trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      case 'same': return '-';
      default: return '-';
    }
  };

  // 格式化分數
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  // 取得前三名
  const topThree = players.slice(0, 3);
  const [first, second, third] = topThree;

  // 載入中狀態
  if (loading) {
    return (
      <div style={{
        margin: 0,
        boxSizing: 'border-box',
        fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
        background: 'linear-gradient(135deg, #648dbd, #88c0f2)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>
            載入排行榜中...
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255,255,255,0.3)',
            borderTop: '5px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div style={{
        margin: 0,
        boxSizing: 'border-box',
        fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
        background: 'linear-gradient(135deg, #648dbd, #88c0f2)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 0, 0, 0.1)',
          padding: '30px',
          borderRadius: '10px',
          border: '2px solid rgba(255, 0, 0, 0.3)'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '15px' }}>載入失敗</h2>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={handleRefresh}
            style={{
              background: 'linear-gradient(to bottom, #ffdd55, #ffaa00)',
              color: '#333',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      margin: 0,
      boxSizing: 'border-box',
      fontFamily: "'Microsoft JhengHei', Arial, sans-serif",
      background: 'linear-gradient(135deg, #648dbd, #88c0f2)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px'
    }}>
      <style>{`
        .firework {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.8);
          animation: explode 1s ease-out forwards;
          opacity: 0;
        }

        @keyframes explode {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .shine {
          animation: shine 2s infinite;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          opacity: 0;
        }

        @keyframes shine {
          0% {
            opacity: 0;
            transform: translateX(-100%) rotate(45deg);
          }
          10% {
            opacity: 0.5;
          }
          20% {
            opacity: 0;
            transform: translateX(100%) rotate(45deg);
          }
          100% {
            opacity: 0;
          }
        }

        .shine:nth-child(1) { animation-delay: 0s; }
        .shine:nth-child(2) { animation-delay: 0.7s; }
        .shine:nth-child(3) { animation-delay: 1.4s; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', margin: '20px 0 40px' }}>
        <h1 style={{
          fontSize: '3rem',
          color: '#ffd700',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          marginBottom: '10px',
          margin: 0
        }}>
          LEADERBOARD
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#e0e0e0',
          margin: 0
        }}>
          {gameInfo?.gameTitle || 'ANIME QUIZ'}
        </p>
        {gameInfo && (
          <p style={{
            fontSize: '1rem',
            color: '#b0b0b0',
            margin: '5px 0 0 0'
          }}>
            {gameInfo.status === 'finished' ? '遊戲已結束' : `進行中 - 第 ${gameInfo.currentQuestionNumber} 題`}
          </p>
        )}
      </header>

      {/* 刷新按鈕 */}
      {showRealTime && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔄 刷新排名
          </button>
        </div>
      )}

      {/* Podium */}
      <div 
        ref={podiumContainerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          width: '100%',
          maxWidth: '900px',
          height: '400px',
          marginBottom: '50px',
          position: 'relative'
        }}
      >
        {/* Second Place */}
        {second && (
          <div className="player second" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              2
            </div>
            <div className="player-avatar" style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '5px solid #c0c0c0',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
              backgroundColor: '#444',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2
            }}>
              <img 
                src={second.avatar} 
                alt="第二名" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="shine"></div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                marginBottom: '5px',
                color: '#c0c0c0'
              }}>
                {second.name}
              </div>
              <div style={{ fontSize: '1rem', color: '#e0e0e0' }}>
                {formatScore(second.score)} 分
              </div>
            </div>
          </div>
        )}

        {/* First Place */}
        {first && (
          <div className="player first" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              1
            </div>
            <div className="player-avatar" style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: '6px solid #ffd700',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
              backgroundColor: '#444',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 3
            }}>
              <img 
                src={first.avatar} 
                alt="第一名" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="shine"></div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                marginBottom: '5px',
                color: '#ffd700'
              }}>
                {first.name}
              </div>
              <div style={{ fontSize: '1.3rem', color: '#e0e0e0' }}>
                {formatScore(first.score)} 分
              </div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {third && (
          <div className="player third" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              3
            </div>
            <div className="player-avatar" style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              border: '5px solid #cd7f32',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
              backgroundColor: '#444',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <img 
                src={third.avatar} 
                alt="第三名" 
                style={{ width: '101%', height: '101%', objectFit: 'cover' }}
              />
              <div className="shine"></div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                marginBottom: '5px',
                color: '#cd7f32'
              }}>
                {third.name}
              </div>
              <div style={{ fontSize: '1rem', color: '#e0e0e0' }}>
                {formatScore(third.score)} 分
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranking Table */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        marginTop: '50px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '1.1rem',
                width: '50px',
                fontWeight: 'bold'
              }}>
                Rank
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '1.1rem'
              }}>
                Players
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '1.1rem'
              }}>
                Score
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '1.1rem'
              }}>
                Time
              </th>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '1.1rem'
              }}>
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr 
                key={player.id}
                style={{
                  background: index % 2 === 1 ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
                }}
              >
                <td style={{
                  padding: '15px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: getRankClass(player.rank) === 'gold' ? '#ffd700' : 
                         getRankClass(player.rank) === 'silver' ? '#c0c0c0' :
                         getRankClass(player.rank) === 'bronze' ? '#cd7f32' : 'white'
                }}>
                  {player.rank}
                </td>
                <td style={{ padding: '15px', textAlign: 'left' }}>
                  <img 
                    src={player.avatar} 
                    alt={player.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      marginRight: '10px',
                      verticalAlign: 'middle',
                      border: '2px solid white',
                      objectFit: 'cover',
                      backgroundColor: '#444'
                    }}
                  />
                  {player.name}
                </td>
                <td style={{ padding: '15px', textAlign: 'left' }}>
                  {formatScore(player.score)}
                </td>
                <td style={{ padding: '15px', textAlign: 'left' }}>
                  {player.time}
                </td>
                <td style={{ padding: '15px', textAlign: 'left' }}>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: player.trend === 'up' ? '#25c425' :
                           player.trend === 'down' ? '#e02828' : '#ffffff'
                  }}>
                    {getTrendSymbol(player.trend)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Continue Button */}
      <div style={{ margin: '40px 0', textAlign: 'center' }}>
        <button
          onClick={onContinue}
          style={{
            display: 'inline-block',
            padding: '15px 50px',
            background: 'linear-gradient(to bottom, #ffdd55, #ffaa00)',
            color: '#333',
            border: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            borderRadius: '30px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3), 0 3px 5px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.background = 'linear-gradient(to bottom, #ffee77, #ffbb22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3), 0 3px 5px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.background = 'linear-gradient(to bottom, #ffdd55, #ffaa00)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3)';
          }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
};

export default AnimeQuizLeaderboard;