
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BoostModalProps {
  open: boolean;
  onClose: () => void;
}

const BoostModal: React.FC<BoostModalProps> = ({ open, onClose }) => {
  const [showMen, setShowMen] = useState(false);
  const [showWomen, setShowWomen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayTON = () => {
    setIsProcessing(true);
    
    // Simulate payment process
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      
      toast({
        title: "Буст активирован!",
        description: "Теперь вы будете показываться популярным пользователям в течение 24 часов.",
      });
    }, 2000);
  };

  const handlePayUSDT = () => {
    setIsProcessing(true);
    
    // Simulate payment process
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      
      toast({
        title: "Буст активирован!",
        description: "Теперь вы будете показываться популярным пользователям в течение 24 часов.",
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-400" />
            Активировать буст
          </DialogTitle>
          <DialogDescription>
            Буст позволяет показывать вас популярным людям противоположного пола в течение 24 часов
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-men" 
                checked={showMen} 
                onCheckedChange={() => setShowMen(!showMen)}
              />
              <Label htmlFor="show-men">Показывать мужчинам</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-women" 
                checked={showWomen} 
                onCheckedChange={() => setShowWomen(!showWomen)}
              />
              <Label htmlFor="show-women">Показывать женщинам</Label>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md">
            <p className="text-sm text-gray-400 mb-2">Стоимость буста на 24 часа</p>
            <div className="flex justify-between">
              <span className="font-bold">10 TON</span>
              <span className="text-gray-400">≈ $30</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="sm:w-1/2"
            disabled={isProcessing}
          >
            Отмена
          </Button>
          <div className="flex sm:w-1/2 gap-2">
            <Button 
              onClick={handlePayTON} 
              disabled={isProcessing || (!showMen && !showWomen)} 
              className="flex-1"
            >
              {isProcessing ? 'Обработка...' : 'TON'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handlePayUSDT} 
              disabled={isProcessing || (!showMen && !showWomen)}
              className="flex-1"
            >
              USDT
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoostModal;
