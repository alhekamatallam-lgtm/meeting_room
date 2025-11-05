import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApiData, ViewType, Booking } from './types';
import { fetchData, addBooking, updateBooking } from './services/apiService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import Hospitality from './components/Hospitality';
import Rooms from './components/Rooms';
import Admin from './components/Admin';
import Modal from './components/Modal';
import Toast from './components/Toast';
import TodayBookings from './components/TodayBookings';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = useCallback(async (isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const apiData = await fetchData();
      setData(apiData);
      setError(null);
    } catch (err) {
      setError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      if (isBackgroundRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Refresh data on view change (soft refresh)
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    loadData(true);
  }, [view, loadData]);

  // Refresh data on window focus (soft refresh)
  useEffect(() => {
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);


  const handleSetView = (newView: ViewType) => {
    if (newView === 'admin' && !isAdminAuthenticated) {
      setShowPasswordPrompt(true);
    } else {
      setView(newView);
    }
  };

  const handleAdminLogin = () => {
    if (passwordInput === 'admin') {
      setIsAdminAuthenticated(true);
      setShowPasswordPrompt(false);
      setView('admin');
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('كلمة المرور غير صحيحة.');
    }
  };
  
  const handleUpdateBooking = async (updatedBooking: Booking): Promise<void> => {
    if (!data) return;
    setIsSubmitting(true);
    try {
      await updateBooking(updatedBooking);
      await loadData(true); // Soft refresh
      setToast({ message: 'تم تحديث الحجز بنجاح!', type: 'success' });
    } catch (error) {
      console.error("Failed to update booking via API:", error);
      setToast({ message: 'حدث خطأ أثناء تحديث الحجز.', type: 'error' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddBooking = async (newBookingData: Omit<Booking, 'رقم الحجز'>): Promise<void> => {
    if (!data) return;
    setIsSubmitting(true);
    try {
      await addBooking(newBookingData);
      await loadData(true); // Soft refresh
      setToast({ message: 'تم طلب حجز القاعة بنجاح!', type: 'success' });
    } catch (error) {
      console.error("Failed to add booking via API:", error);
      setToast({ message: 'حدث خطأ أثناء إضافة الحجز.', type: 'error' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-primary text-xl">
          <img 
            src="https://cdn.prod.website-files.com/5ee0d0c8efb107a26419bf01/5ee0d97bc8ef9ba80c03b6fb_Logo_02.png" 
            alt="شعار التحميل" 
            className="h-24 animate-pulse mb-4"
          />
          <p>جار التحميل...</p>
        </div>
      );
    }

    if (error) {
      return <div className="flex items-center justify-center h-full text-red-600 text-xl">{error}</div>;
    }

    if (!data) {
      return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات لعرضها.</div>;
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard dashboardData={data.Dashboard} bookings={data.Bookings} />;
      case 'bookings':
        return <Bookings initialBookings={data.Bookings} rooms={data.Rooms} hospitality={data.Hospitality} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} isSubmitting={isSubmitting} />;
      case 'today':
        return <TodayBookings bookings={data.Bookings} />;
      case 'hospitality':
        return <Hospitality hospitalityData={data.Hospitality} />;
      case 'rooms':
        return <Rooms roomsData={data.Rooms} />;
      case 'admin':
         return <Admin allBookings={data.Bookings} rooms={data.Rooms} hospitality={data.Hospitality} onUpdateBooking={handleUpdateBooking} isSubmitting={isSubmitting} />;
      default:
        return <Dashboard dashboardData={data.Dashboard} bookings={data.Bookings} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-gray text-text-dark">
      <Sidebar 
        activeView={view} 
        setView={handleSetView} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isRefreshing={isRefreshing}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderView()}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showPasswordPrompt && (
        <Modal onClose={() => setShowPasswordPrompt(false)} title="تسجيل الدخول للمشرف">
          <div className="space-y-4">
            <p>الرجاء إدخال كلمة المرور للوصول إلى صفحة الإدارة.</p>
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                autoFocus
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={handleAdminLogin} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-900">
                دخول
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default App;