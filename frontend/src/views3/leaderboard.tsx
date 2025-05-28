import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
}

const Leaderboard: React.FC = () => {
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const [nextFireworkId, setNextFireworkId] = useState(0);

  // Sample data - in real app this would come from props or API
  const players: Player[] = [
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

  const createFirework = () => {
    const particles: FireworkParticle[] = [];
    const particleCount = 20;
    const colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF'];
    
    // Center fireworks around the first place avatar
    const centerX = 50; // percentage
    const centerY = 50; // percentage
    const radius = 30; // percentage
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      particles.push({
        id: nextFireworkId + i,
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 500
      });
    }
    
    setFireworks(prev => [...prev, ...particles]);
    setNextFireworkId(prev => prev + particleCount);
    
    // Remove particles after animation
    setTimeout(() => {
      setFireworks(prev => prev.filter(p => !particles.some(np => np.id === p.id)));
    }, 1500);
  };

  useEffect(() => {
    // Create initial firework
    createFirework();
    
    // Create fireworks periodically
    const interval = setInterval(createFirework, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-white';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="text-green-400 font-bold text-xl">▲</span>;
      case 'down': return <span className="text-red-400 font-bold text-xl">▼</span>;
      case 'same': return <span className="text-white font-bold text-xl">-</span>;
      default: return null;
    }
  };

  const PodiumPlayer: React.FC<{ player: Player; position: number }> = ({ player, position }) => {
    const sizeClasses = {
      1: 'w-40 h-40 border-6 border-yellow-400',
      2: 'w-36 h-36 border-4 border-gray-300',
      3: 'w-32 h-32 border-4 border-amber-600'
    };

    const nameClasses = {
      1: 'text-2xl text-yellow-400',
      2: 'text-xl text-gray-300',
      3: 'text-xl text-amber-600'
    };

    const scoreClasses = {
      1: 'text-xl text-white',
      2: 'text-lg text-gray-200',
      3: 'text-lg text-gray-200'
    };

    return (
      <div className="flex flex-col items-center transition-all duration-300 ease-in-out">
        <div className={`text-4xl font-bold mb-4 ${getRankColor(position)}`}>
          {position}
        </div>
        <div className={`relative rounded-full overflow-hidden shadow-2xl ${sizeClasses[position as keyof typeof sizeClasses]} bg-gray-600 flex items-center justify-center`}>
          <img 
            src={player.avatar} 
            alt={`第${position}名`}
            className="w-full h-full object-cover"
          />
          {/* Shine effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-pulse"
            style={{
              background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
              animationDelay: `${position * 0.7}s`,
              animationDuration: '2s',
              animationIterationCount: 'infinite'
            }}
          />
        </div>
        <div className="text-center mt-4">
          <div className={`font-bold mb-1 ${nameClasses[position as keyof typeof nameClasses]}`}>
            {player.name}
          </div>
          <div className={`${scoreClasses[position as keyof typeof scoreClasses]}`}>
            {player.score.toLocaleString()} 分
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white flex flex-col items-center p-5">
      {/* Header */}
      <header className="text-center my-5 mb-10">
        <h1 className="text-6xl font-bold text-yellow-400 mb-4 drop-shadow-2xl">
          LEADERBOARD
        </h1>
        <p className="text-xl text-gray-200">ANIME QUIZ</p>
      </header>

      {/* Podium Container */}
      <div className="relative flex justify-center items-end w-full max-w-4xl h-96 mb-12">
        {/* Fireworks */}
        {fireworks.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full opacity-0 animate-ping"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px 5px ${particle.color}80`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: '1s',
              animationFillMode: 'forwards'
            }}
          />
        ))}

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
      <div className="w-full max-w-4xl mt-12 bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/30">
              <th className="p-4 text-left font-bold text-lg w-16">Rank</th>
              <th className="p-4 text-left font-bold text-lg">Players</th>
              <th className="p-4 text-left font-bold text-lg">Score</th>
              <th className="p-4 text-left font-bold text-lg">Time</th>
              <th className="p-4 text-left font-bold text-lg">Trend</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr 
                key={player.id}
                className={`${
                  index % 2 === 1 ? 'bg-white/5' : ''
                } hover:bg-white/10 transition-colors duration-200`}
              >
                <td className={`p-4 text-center font-bold ${getRankColor(index + 1)}`}>
                  {index + 1}
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <img 
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-full mr-3 border-2 border-white object-cover bg-gray-600"
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                </td>
                <td className="p-4 font-medium">{player.score.toLocaleString()}</td>
                <td className="p-4">{player.time}</td>
                <td className="p-4 text-center">
                  {getTrendIcon(player.trend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Continue Button */}
      <div className="mt-10 mb-8">
        <Button 
          className="px-12 py-4 text-xl font-bold bg-gradient-to-b from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-gray-800 rounded-full shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 uppercase tracking-wider border-0"
          onClick={() => {
            // Handle continue action
            console.log('Continue clicked');
          }}
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
};

export default Leaderboard;