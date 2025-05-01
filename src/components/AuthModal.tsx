
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!validateEmail(email)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email",
        variant: "destructive",
      });
      return;
    }
    
    if (!validatePassword(password)) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать не менее 8 символов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Ошибка входа",
            description: "Неверный email или пароль",
            variant: "destructive",
          });
          return;
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Ошибка регистрации",
            description: "Не удалось зарегистрироваться. Возможно, пользователь уже существует.",
            variant: "destructive",
          });
          return;
        }
        setIsLogin(true);
        toast({
          title: "Регистрация успешна!",
          description: "Вы можете войти в систему, используя свой email и пароль.",
        });
        return;
      }
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при авторизации",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {isLogin ? "Вход" : "Регистрация"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isLogin ? "Войдите в свой аккаунт TeleMatch" : "Создайте новый аккаунт TeleMatch"}
          </DialogDescription>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-400">
              Минимум 8 символов
            </p>
          </div>
          <div className="pt-4 space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  {isLogin ? "Входим..." : "Регистрируемся..."}
                </span>
              ) : (
                isLogin ? "Войти" : "Зарегистрироваться"
              )}
            </Button>
            <div className="text-center">
              <button 
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
