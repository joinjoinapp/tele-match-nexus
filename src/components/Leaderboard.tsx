
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Header from './Header';

interface Leader {
  id: number;
  username: string;
  matchTokens: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  const itemsPerPage = 10;

  useEffect(() => {
    // Simulated API call for leaderboard data
    const fetchLeaders = async () => {
      setIsLoading(true);
      try {
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockLeaders: Leader[] = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          username: `user_${Math.floor(Math.random() * 10000)}`,
          matchTokens: Math.floor(Math.random() * 10000) + 100,
          rank: i + 1
        }));
        
        // Sort by match tokens (descending)
        mockLeaders.sort((a, b) => b.matchTokens - a.matchTokens);
        
        setLeaders(mockLeaders);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaders();
  }, []);

  const filteredLeaders = leaders.filter(leader => 
    leader.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedLeaders = filteredLeaders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAuthClick = () => {
    // For demo purposes, we'll just navigate to the video chat
    // In a real app, this would show the auth modal
    navigate('/video-chat');
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Header isAuthenticated={isAuthenticated} onAuthClick={handleAuthClick} />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Таблица лидеров</h1>
          <p className="text-gray-400">
            Топ пользователей по количеству заработанных $match токенов
          </p>
        </div>
        
        <div className="mb-6">
          <Input
            placeholder="Поиск по имени пользователя..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900 border-gray-800 text-white"
          />
        </div>
        
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableCaption>Данные актуальны на {new Date().toLocaleDateString()}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-gray-800/50">
                  <TableHead className="text-gray-400 w-24 text-center">Место</TableHead>
                  <TableHead className="text-gray-400">Пользователь</TableHead>
                  <TableHead className="text-gray-400 text-right">$match токены</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeaders.map((leader) => (
                  <TableRow 
                    key={leader.id}
                    className="hover:bg-gray-800/50 transition-colors border-b border-gray-800"
                  >
                    <TableCell className="text-center font-medium">
                      {leader.rank <= 3 ? (
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center mx-auto
                          ${leader.rank === 1 ? 'bg-yellow-500' : 
                            leader.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'}
                        `}>
                          {leader.rank}
                        </div>
                      ) : (
                        leader.rank
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{leader.username}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-match font-bold">{leader.matchTokens}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-gray-800 hover:bg-gray-800"
            >
              Назад
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={page === currentPage ? 
                  "bg-primary hover:bg-primary/90" : 
                  "border-gray-800 hover:bg-gray-800"
                }
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-800 hover:bg-gray-800"
            >
              Вперёд
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
