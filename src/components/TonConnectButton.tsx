
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
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
    >
      <img 
        src="https://ton.org/download/ton_symbol.svg" 
        alt="TON" 
        className="w-5 h-5 mr-2" 
      />
      {isConnecting ? 'Подключение...' : 'Войти через TON'}
    </Button>
  );
};

export default TonConnectButton;
