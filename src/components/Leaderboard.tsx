import React from 'react';
import { Crown, TrendingUp as Trending, Star } from 'lucide-react';

export function Leaderboard() {
  const topCreators = [
    {
      rank: 1,
      name: "DJ Crypto",
      avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=200&q=80",
      earnings: "45,230",
      followers: "128K",
    },
    {
      rank: 2,
      name: "Luna Beats",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      earnings: "38,450",
      followers: "95K",
    },
    {
      rank: 3,
      name: "Web3 Wizard",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      earnings: "32,180",
      followers: "82K",
    },
  ];

  return (
    <section id="leaderboard" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Top Creators</h2>
          <p className="text-xl text-gray-400">Meet our most successful artists</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topCreators.map((creator, index) => (
            <div
              key={index}
              className="relative p-6 rounded-2xl bg-gray-800/50 backdrop-blur-lg
                         transform transition-all duration-300 hover:-translate-y-2"
            >
              {index === 0 && (
                <div className="absolute -top-4 -right-4 bg-neon-purple rounded-full p-2">
                  <Crown className="w-6 h-6" />
                </div>
              )}
              <div className="flex items-center mb-4">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h3 className="text-xl font-bold">{creator.name}</h3>
                  <p className="text-gray-400">Rank #{creator.rank}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Earnings</p>
                  <p className="text-xl font-bold">${creator.earnings}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Followers</p>
                  <p className="text-xl font-bold">{creator.followers}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="neon-button-secondary">
            View Full Leaderboard
          </button>
        </div>
      </div>
    </section>
  );
}