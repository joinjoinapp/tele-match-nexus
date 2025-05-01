
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="text-9xl font-bold text-primary mb-4">404</div>
      <h1 className="text-4xl font-bold mb-6">Страница не найдена</h1>
      <p className="text-gray-400 text-center mb-8 max-w-md">
        Извините, запрашиваемая страница не существует или была перемещена.
      </p>
      <Link to="/">
        <Button className="bg-primary hover:bg-primary/90">Вернуться на главную</Button>
      </Link>
    </div>
  );
};

export default NotFound;
