import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/navigation/BottomNav';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F7]">
      <main className="flex-1 pb-with-bottom-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
