import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import AuthProvider from '@/components/AuthProvider';
import ToastProvider from '@/components/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex flex-1 h-screen overflow-hidden bg-[#FFFBEB] text-[#1C1917]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
            {children}
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
