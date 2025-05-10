
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ProfileSettingsProps {
  initialUsername: string;
  initialGender: 'male' | 'female' | null;
  onSave: (username: string, gender: 'male' | 'female' | null, walletAddress: string) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  initialUsername, 
  initialGender,
  onSave
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [gender, setGender] = useState<'male' | 'female' | null>(initialGender);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    // Simulate TON wallet connection
    setTimeout(() => {
      setWalletAddress('UQCyx...j7Vd');
      setIsConnectingWallet(false);
      toast({
        title: "Кошелек подключен",
        description: "Ваш TON кошелек успешно привязан к аккаунту",
      });
    }, 1500);
  };

  const handleSave = () => {
    if (username.trim().length < 3) {
      toast({
        title: "Ошибка",
        description: "Имя пользователя должно содержать минимум 3 символа",
        variant: "destructive",
      });
      return;
    }

    onSave(username, gender, walletAddress);
    toast({
      title: "Настройки сохранены",
      description: "Ваш профиль успешно обновлен",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="username">Уникальный никнейм</Label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">telematch.ru/</span>
          <Input 
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mynickname"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Пол</Label>
        <RadioGroup value={gender || ''} onValueChange={(value) => setGender(value as 'male' | 'female')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male">Мужской</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female">Женский</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>TON Кошелек</Label>
        {walletAddress ? (
          <div className="flex items-center">
            <div className="bg-gray-800 px-3 py-2 rounded flex-1 text-gray-300 text-sm font-mono">
              {walletAddress}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setWalletAddress('')}
              className="ml-2"
            >
              Отвязать
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={handleConnectWallet}
            disabled={isConnectingWallet}
          >
            {isConnectingWallet ? 'Подключение...' : 'Подключить TON Wallet'}
          </Button>
        )}
      </div>

      <Button onClick={handleSave} className="w-full">
        Сохранить изменения
      </Button>
    </div>
  );
};

export default ProfileSettings;
