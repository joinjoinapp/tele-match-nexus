
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/UserProfile';
import ProfileSettings from '@/components/ProfileSettings';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Mock data for demonstration
  const [username, setUsername] = useState(user?.email?.split('@')[0] || 'user123');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [followers, setFollowers] = useState(345);
  const [following, setFollowing] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    if (isFollowing) {
      setFollowers(prev => prev - 1);
    } else {
      setFollowers(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  const handleSaveSettings = (newUsername: string, newGender: 'male' | 'female' | null, newWalletAddress: string) => {
    setUsername(newUsername);
    setGender(newGender);
    if (newWalletAddress) {
      setWalletAddress(newWalletAddress);
    }
    setActiveTab("profile");
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 pl-0"
            onClick={() => navigate('/')}
          >
            ← Назад
          </Button>
          <h1 className="text-2xl font-bold">Профиль</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="profile">Мой профиль</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="pt-2">
            <UserProfile 
              username={username}
              followers={followers}
              isFollowing={isFollowing}
              onFollow={handleFollow}
            />
            
            <div className="mt-8 bg-gray-900 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Статистика</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-2xl font-bold text-primary">{following.length}</p>
                  <p className="text-gray-400 text-sm">Подписок</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-400">1254</p>
                  <p className="text-gray-400 text-sm">$match</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-500">42h</p>
                  <p className="text-gray-400 text-sm">В чате</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-gray-900 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Мои подписки</h3>
                <Button 
                  variant="outline"
                  className="text-sm h-8"
                  onClick={() => navigate('/video-chat?filter=followed')}
                >
                  Видео с подписками
                </Button>
              </div>
              
              {following.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Follow list would go here */}
                  <div className="text-gray-400">User list would display here</div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>У вас пока нет подписок</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/video-chat')}
                  >
                    Начать общение
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="bg-gray-900 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-800">
              <ProfileSettings 
                initialUsername={username}
                initialGender={gender}
                onSave={handleSaveSettings}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
