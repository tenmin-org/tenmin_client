import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/navigation/BottomNav';

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
