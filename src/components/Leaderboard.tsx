
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';

interface User {
  id: string;
  username: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
}

const Leaderboard: React.FC = () => {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch real users from the auth.users table via Supabase
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('id, email, user_metadata')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (authError) {
        console.error('Error fetching users:', authError);
        toast({
          title: t('error'),
          description: t('errorFetchingUsers'),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Transform user data for leaderboard
      const leaderboardUsers = authUsers.map((authUser, index) => {
        const username = authUser.email || 
                        (authUser.user_metadata?.username) || 
                        (authUser.user_metadata?.name) || 
                        `${t('user')} ${index + 1}`;
        
        // Calculate a score based on some factor (e.g., user ID)
        // In a real app, you would have a separate scores table
        const score = Math.floor(Math.random() * 1000) + 100;
        
        return {
          id: authUser.id,
          username: username,
          score: score,
          rank: index + 1,
          isCurrentUser: user?.id === authUser.id,
        };
      }).sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));
      
      setUsers(leaderboardUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: t('error'),
        description: t('somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      navigate('/video-chat');
    } else {
      // Handle authentication required toast
      toast({
        title: t('authRequired'),
        description: t('pleaseLoginFirst'),
        variant: 'default',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header isAuthenticated={isAuthenticated} onAuthClick={handleAuthClick} />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">{t('leaderboard')}</h1>
          <p className="text-gray-400">{t('leaderboardDescription')}</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg overflow-hidden border border-gray-700">
            <div className="grid grid-cols-12 py-3 px-4 border-b border-gray-700 bg-gray-900">
              <div className="col-span-2 font-semibold">{t('rank')}</div>
              <div className="col-span-6 font-semibold">{t('user')}</div>
              <div className="col-span-4 text-right font-semibold">{t('score')}</div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-t-2 border-primary border-solid rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-400">{t('loadingLeaderboard')}</p>
              </div>
            ) : users.length > 0 ? (
              <div>
                {users.map((user, index) => (
                  <div 
                    key={user.id} 
                    className={`grid grid-cols-12 py-3 px-4 border-b border-gray-700 
                      ${user.isCurrentUser ? 'bg-primary bg-opacity-10' : index % 2 === 0 ? 'bg-gray-800 bg-opacity-30' : ''}`}
                  >
                    <div className="col-span-2">
                      {user.rank === 1 && '🥇'}
                      {user.rank === 2 && '🥈'}
                      {user.rank === 3 && '🥉'}
                      {user.rank > 3 && `#${user.rank}`}
                    </div>
                    <div className="col-span-6">
                      {user.username}
                      {user.isCurrentUser && <span className="ml-2 text-xs bg-primary px-1 py-0.5 rounded">{t('you')}</span>}
                    </div>
                    <div className="col-span-4 text-right font-mono">{user.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-400">{t('noUsersFound')}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/video-chat')} 
              className="bg-primary hover:bg-primary/90"
            >
              {t('startMatch')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
