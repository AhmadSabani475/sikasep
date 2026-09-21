import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import AuthProvider from '@/components/AuthProvider';
import ToastProvider from '@/components/Toast';
import AIChatWidget from '@/components/AIChatWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex flex-1 h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
          <AIChatWidget />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
