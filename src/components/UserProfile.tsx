
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Heart } from 'lucide-react';

interface UserProfileProps {
  username: string;
  followers: number;
  profileImage?: string;
  isFollowing: boolean;
  onFollow: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  username, 
  followers, 
  profileImage, 
  isFollowing, 
  onFollow 
}) => {
  const navigate = useNavigate();

  const handleChatWithFollowed = () => {
    navigate('/video-chat?filter=followed');
  };

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-md rounded-lg p-6 border border-gray-800">
      <div className="flex items-center mb-6">
        <div className="relative w-16 h-16 mr-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-purple-700 opacity-70"></div>
          <div className="absolute inset-0.5 rounded-full overflow-hidden bg-gray-900">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={username} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{username}</h3>
          <p className="text-gray-400 flex items-center">
            <Heart size={14} className="mr-1" />
            <span>{followers} подписчиков</span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant={isFollowing ? "outline" : "default"}
          className={isFollowing ? "border-primary text-primary hover:bg-primary/10" : ""}
          onClick={onFollow}
        >
          {isFollowing ? 'Отписаться' : 'Подписаться'}
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center border-gray-700 hover:bg-gray-800"
          onClick={handleChatWithFollowed}
        >
          <Users size={16} className="mr-2" />
          Чат с подписками
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
