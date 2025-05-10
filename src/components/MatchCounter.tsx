
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinAnimation {
  id: number;
  x: number;
  y: number;
}

interface MatchCounterProps {
  value: number;
  onChange?: (value: number) => void;
}

const MatchCounter: React.FC<MatchCounterProps> = ({ value, onChange }) => {
  const [coins, setCoins] = useState<CoinAnimation[]>([]);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value > prevValue && value % 1 === 0) {
      // Create 1-3 coins for every whole number increase
      const newCoins = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50, // Random X position between -50 and 50
        y: Math.random() * -100 - 50, // Random Y position always going up
      }));
      
      setCoins(prev => [...prev, ...newCoins]);
      
      // Remove coins after animation
      setTimeout(() => {
        setCoins(prev => prev.filter(coin => !newCoins.find(newCoin => newCoin.id === coin.id)));
      }, 2000);
    }
    
    setPrevValue(value);
  }, [value, prevValue]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="flex items-center justify-center px-4 py-2 bg-black bg-opacity-50 rounded-full backdrop-blur-sm">
        <span className="text-yellow-400 font-bold text-2xl mr-2">$match</span>
        <span className="text-white text-2xl">{value.toFixed(0)}</span>
      </div>
      
      <AnimatePresence>
        {coins.map(coin => (
          <motion.div
            key={coin.id}
            className="absolute w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xs z-10 shadow-glow"
            initial={{ scale: 0.5, opacity: 0, x: 0, y: 0 }}
            animate={{ 
              scale: 1, 
              opacity: [0, 1, 1, 0],
              x: coin.x, 
              y: coin.y,
              transition: { duration: 2, ease: "easeOut" }
            }}
            exit={{ opacity: 0 }}
          >
            $
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MatchCounter;
