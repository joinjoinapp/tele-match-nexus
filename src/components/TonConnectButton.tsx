
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface TonConnectButtonProps {
  onConnect: (address: string) => void;
}

const TonConnectButton: React.FC<TonConnectButtonProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    setIsConnecting(true);
    
    // Simulate wallet connection
    setTimeout(() => {
      const walletAddress = 'UQ' + Math.random().toString(36).substring(2, 8) + '...' + Math.random().toString(36).substring(2, 6);
      
      setIsConnecting(false);
      onConnect(walletAddress);
      
      toast({
        title: 'Успешное подключение',
        description: `Кошелек ${walletAddress} подключен`,
      });
    }, 1500);
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      variant="outline"
      className="border-gray-700 hover:bg-gray-800 text-white py-3 px-4 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20"
    >
      <img 
        src="https://ton.org/download/ton_symbol.svg" 
        alt="TON" 
        className="w-5 h-5" 
      />
      <span>{isConnecting ? 'Подключение...' : 'Войти через TON'}</span>
    </Button>
  );
};

export default TonConnectButton;
