import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Player {
  id: number;
  name: string;
  score: number;
  time: string;
  avatar: string;
  trend: 'up' | 'down' | 'same';
}

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  vx: number;
  vy: number;
}

interface LeaderboardProps {
  mode: 'temporary' | 'final';
  players: Player[];
  onContinue?: () => void;
  questionNumber?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  mode = 'final', 
  players = defaultPlayers, 
  onContinue,
  questionNumber 
}) => {
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const [nextFireworkId, setNextFireworkId] = useState(0);

  const createFirework = () => {
    const particles: FireworkParticle[] = [];
    const particleCount = 15;
    const colors = ['#FFD700', '#FF4500', '#FF1493', '#00CED1', '#32CD32', '#FF69B4', '#FFA500'];
    
    // 隨機位置
    const centerX = Math.random() * 60 + 20; // 20% to 80%
    const centerY = Math.random() * 40 + 10; // 10% to 50%
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = Math.random() * 3 + 2;
      
      particles.push({
        id: nextFireworkId + i,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 200,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity
      });
    }
    
    setFireworks(prev => [...prev, ...particles]);
    setNextFireworkId(prev => prev + particleCount);
    
    // 清理粒子
    setTimeout(() => {
      setFireworks(prev => prev.filter(p => !particles.some(np => np.id === p.id)));
    }, 2000);
  };

  useEffect(() => {
    if (mode === 'final') {
      // 立即創建第一個煙火
      createFirework();
      // 然後每1.5秒創建一個新煙火
      const interval = setInterval(createFirework, 1500);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-500';
      case 3: return 'text-amber-700';
      default: return 'text-black';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="text-green-600 font-bold text-xl">▲</span>;
      case 'down': return <span className="text-red-600 font-bold text-xl">▼</span>;
      case 'same': return <span className="text-black font-bold text-xl">-</span>;
      default: return null;
    }
  };

  const getPlayerInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const PodiumPlayer: React.FC<{ player: Player; position: number }> = ({ player, position }) => {
    const sizeClasses = {
      1: 'w-40 h-40',
      2: 'w-36 h-36',
      3: 'w-32 h-32'
    };

    const borderClasses = {
      1: 'border-8 border-yellow-400 shadow-yellow-200',
      2: 'border-6 border-gray-300 shadow-gray-200',
      3: 'border-6 border-amber-600 shadow-amber-200'
    };

    const nameClasses = {
      1: 'text-2xl text-yellow-300',
      2: 'text-xl text-gray-300',
      3: 'text-xl text-amber-300'
    };

    // 在 final mode 下分數顯示為白色
    const scoreClasses = {
      1: 'text-xl text-white',
      2: 'text-lg text-white',
      3: 'text-lg text-white'
    };

    return (
      <div className="flex flex-col items-center transition-all duration-500 ease-in-out hover:scale-105">
        <div className={`text-4xl font-bold mb-4 ${getRankColor(position)} drop-shadow-lg`}>
          {position}
        </div>
        <div className="relative">
          <Avatar className={`${sizeClasses[position as keyof typeof sizeClasses]} ${borderClasses[position as keyof typeof borderClasses]} shadow-2xl transition-all duration-300 hover:shadow-3xl`}>
            <AvatarImage 
              src={getAvatarByRank(position)} 
              alt={`第${position}名`}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-gray-100 to-gray-200">
              {getPlayerInitials(player.name)}
            </AvatarFallback>
          </Avatar>
          {/* 增強的光澤反光效果 */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
              animationDelay: `${position * 0.5}s`,
              animationDuration: '3s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out'
            }}
          />
          {/* 額外的閃光效果 */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 70%)',
              animationDelay: `${position * 0.7 + 1.5}s`,
              animationDuration: '2s',
              animationIterationCount: 'infinite',
              animationName: 'ping',
              animationTimingFunction: 'ease-out'
            }}
          />
        </div>
        <div className="text-center mt-4">
          <div className={`font-bold mb-1 ${nameClasses[position as keyof typeof nameClasses]} drop-shadow-sm`}>
            {player.name}
          </div>
          <div className={`${scoreClasses[position as keyof typeof scoreClasses]} font-semibold`}>
            {player.score.toLocaleString()} 分
          </div>
        </div>
      </div>
    );
  };

  // Fixed avatar URLs based on rank
  const getAvatarByRank = (rank: number) => {
    switch (rank) {
      case 1: return 'https://i.pinimg.com/474x/2f/ec/a4/2feca4c9330929232091f910dbff7f87.jpg';
      case 2: return 'https://i.pinimg.com/736x/1c/27/c6/1c27c6b4f4776e7ca9da75c5e93a5b4f.jpg';
      case 3: return 'https://i.pinimg.com/736x/3d/cd/4a/3dcd4af5bc9e06d36305984730ab7888.jpg';
      default: return 'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png';
    }
  };

  // 煙火粒子組件
  const FireworkParticle: React.FC<{ particle: FireworkParticle }> = ({ particle }) => {
    const [position, setPosition] = useState({ x: particle.x, y: particle.y });
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
      const startTime = Date.now();
      const duration = 2000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 更新位置
        setPosition({
          x: particle.x + particle.vx * progress * 8,
          y: particle.y + particle.vy * progress * 8 + progress * progress * 15 // 重力效果
        });

        // 更新透明度
        setOpacity(1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      const timeout = setTimeout(() => {
        requestAnimationFrame(animate);
      }, particle.delay);

      return () => clearTimeout(timeout);
    }, [particle]);

    return (
      <div
        className="absolute w-3 h-3 rounded-full pointer-events-none"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          backgroundColor: particle.color,
          opacity: opacity,
          boxShadow: `0 0 15px 3px ${particle.color}60`,
          transform: `scale(${opacity})`,
          transition: 'none'
        }}
      />
    );
  };

  // Temporary Leaderboard (Question End)
  if (mode === 'temporary') {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center p-5">
        {/* Header for Temporary */}
        <header className="text-center my-8 mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">
            CURRENT STANDINGS
          </h1>
          {questionNumber && (
            <p className="text-xl text-gray-600">
              Question {questionNumber} Results
            </p>
          )}
        </header>

        {/* Only Ranking Table for Temporary */}
        <div className="w-full max-w-4xl bg-white border-2 border-blue-900 rounded-xl overflow-hidden shadow-xl">
          <div className="h-[600px] overflow-y-auto">
            {/* 表頭 */}
            <div className="bg-gray-100 border-b-2 border-blue-900">
              <div className="grid grid-cols-12 w-full">
                <div className="col-span-1 p-4 text-center font-bold text-lg border-r border-gray-300">Rank</div>
                <div className="col-span-5 p-4 text-left font-bold text-lg border-r border-gray-300">Players</div>
                <div className="col-span-2 p-4 text-center font-bold text-lg border-r border-gray-300">Score</div>
                <div className="col-span-2 p-4 text-center font-bold text-lg border-r border-gray-300">Time</div>
                <div className="col-span-2 p-4 text-center font-bold text-lg">Trend</div>
              </div>
            </div>
            {/* 內容 */}
            {players.map((player, index) => (
              <div 
                key={player.id}
                className={`${
                  index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-100 transition-colors duration-200 border-b border-gray-200 grid grid-cols-12 w-full`}
              >
                <div className={`col-span-1 p-4 text-center font-bold border-r border-gray-200 ${getRankColor(index + 1)}`}>
                  {index + 1}
                </div>
                <div className="col-span-5 p-4 border-r border-gray-200">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3 border-2 border-black">
                      <AvatarImage 
                        src={getAvatarByRank(index + 1)}
                        alt={player.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-bold bg-gray-200">
                        {getPlayerInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                </div>
                <div className="col-span-2 p-4 font-medium border-r border-gray-200 text-center">{player.score.toLocaleString()}</div>
                <div className="col-span-2 p-4 border-r border-gray-200 text-center">{player.time}</div>
                <div className="col-span-2 p-4 text-center">
                  {getTrendIcon(player.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Final Leaderboard (Game End) - 降低飽和度的背景和按鈕
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white flex flex-col items-center p-5 relative overflow-hidden">
      {/* 煙火容器 */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {fireworks.map(particle => (
          <FireworkParticle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Header */}
      <header className="text-center my-5 mb-10 relative z-20">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
          FINAL RESULTS
        </h1>
        <p className="text-xl text-yellow-300 font-semibold">ANIME QUIZ CHAMPION</p>
      </header>

      {/* Podium Container */}
      <div className="relative flex justify-center items-end w-full max-w-4xl h-96 mb-12 z-20">
        {/* Second Place */}
        <div className="flex-1 flex justify-center">
          <PodiumPlayer player={players[1]} position={2} />
        </div>

        {/* First Place */}
        <div className="flex-1 flex justify-center relative z-10">
          <PodiumPlayer player={players[0]} position={1} />
        </div>

        {/* Third Place */}
        <div className="flex-1 flex justify-center">
          <PodiumPlayer player={players[2]} position={3} />
        </div>
      </div>

      {/* Ranking Table */}
      <div className="w-full max-w-4xl mt-12 bg-white bg-opacity-95 border-2 border-white rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm relative z-20">
        <div className="h-[500px] overflow-y-auto">
          {/* 表頭 */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
            <div className="grid grid-cols-12 w-full">
              <div className="col-span-1 p-4 text-center font-bold text-lg border-r border-gray-300 text-black">Rank</div>
              <div className="col-span-5 p-4 text-left font-bold text-lg border-r border-gray-300 text-black">Players</div>
              <div className="col-span-2 p-4 text-center font-bold text-lg border-r border-gray-300 text-black">Score</div>
              <div className="col-span-2 p-4 text-center font-bold text-lg border-r border-gray-300 text-black">Time</div>
              <div className="col-span-2 p-4 text-center font-bold text-lg text-black">Trend</div>
            </div>
          </div>
          {/* 內容 */}
          {players.map((player, index) => (
            <div 
              key={player.id}
              className={`${
                index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
              } hover:bg-yellow-50 transition-colors duration-200 border-b border-gray-200 grid grid-cols-12 w-full`}
            >
              <div className={`col-span-1 p-4 text-center font-bold border-r border-gray-200 ${getRankColor(index + 1)}`}>
                {index + 1}
              </div>
              <div className="col-span-5 p-4 border-r border-gray-200">
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3 border-2 border-gray-300 shadow-md">
                    <AvatarImage 
                      src={getAvatarByRank(index + 1)}
                      alt={player.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-sm font-bold bg-gray-200 text-black">
                      {getPlayerInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-black">{player.name}</span>
                </div>
              </div>
              <div className="col-span-2 p-4 font-medium border-r border-gray-200 text-black text-center">{player.score.toLocaleString()}</div>
              <div className="col-span-2 p-4 border-r border-gray-200 text-black text-center">{player.time}</div>
              <div className="col-span-2 p-4 text-center">
                {getTrendIcon(player.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Button - 降低飽和度 */}
      <div className="mt-10 mb-8 relative z-20">
        <Button 
          className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black border-2 border-amber-300 rounded-full shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 uppercase tracking-wider cursor-pointer"
          onClick={onContinue}
        >
          PLAY AGAIN
        </Button>
      </div>
    </div>
  );
};

// Default sample data
const defaultPlayers: Player[] = [
  {
    id: 1,
    name: 'Player1',
    score: 9560,
    time: '01:00',
    avatar: 'https://i.pinimg.com/474x/2f/ec/a4/2feca4c9330929232091f910dbff7f87.jpg',
    trend: 'up'
  },
  {
    id: 2,
    name: 'Player2',
    score: 8750,
    time: '02:00',
    avatar: 'https://i.pinimg.com/736x/1c/27/c6/1c27c6b4f4776e7ca9da75c5e93a5b4f.jpg',
    trend: 'same'
  },
  {
    id: 3,
    name: 'Player3',
    score: 7920,
    time: '03:00',
    avatar: 'https://i.pinimg.com/736x/3d/cd/4a/3dcd4af5bc9e06d36305984730ab7888.jpg',
    trend: 'up'
  },
  {
    id: 4,
    name: 'Player4',
    score: 7150,
    time: '04:00',
    avatar: 'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png',
    trend: 'down'
  },
  {
    id: 5,
    name: 'Player5',
    score: 6890,
    time: '05:00',
    avatar: 'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png',
    trend: 'down'
  },
  {
    id: 6,
    name: 'Player6',
    score: 6410,
    time: '06:00',
    avatar: 'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png',
    trend: 'up'
  },
  {
    id: 7,
    name: 'Player7',
    score: 5980,
    time: '07:00',
    avatar: 'https://cdn.miiwiki.org/8/85/Default_Male_Mii.png',
    trend: 'same'
  }
];

export default Leaderboard;