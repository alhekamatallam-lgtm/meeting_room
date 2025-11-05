import React from 'react';
import { ViewType } from '../types';
import { DashboardIcon, BookingsIcon, HospitalityIcon, RoomsIcon, AdminIcon, SidebarToggleIcon, RefreshIcon, TodayIcon } from './icons/Icons';

interface SidebarProps {
  activeView: ViewType;
  setView: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isRefreshing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isCollapsed, onToggle, isRefreshing }) => {
  const navItems = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: <DashboardIcon /> },
    { id: 'bookings', label: 'الحجوزات', icon: <BookingsIcon /> },
    { id: 'today', label: 'حجوزات اليوم', icon: <TodayIcon /> },
    { id: 'hospitality', label: 'الضيافة', icon: <HospitalityIcon /> },
    { id: 'rooms', label: 'القاعات', icon: <RoomsIcon /> },
    { id: 'admin', label: 'إدارة الحجوزات', icon: <AdminIcon /> },
  ];

  return (
    <div className={`bg-background text-text-dark flex flex-col p-4 space-y-4 shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center justify-center py-4 border-b border-gray-200`}>
        <img 
          src="https://cdn.prod.website-files.com/5ee0d0c8efb107a26419bf01/5ee0d97bc8ef9ba80c03b6fb_Logo_02.png" 
          alt="الشعار الرسمي" 
          className={`transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-12'}`}
        />
        {isRefreshing && !isCollapsed && <div className="ms-2 text-secondary"><RefreshIcon /></div>}
      </div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id as ViewType)}
                className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-right ${isCollapsed ? 'justify-center' : ''} ${
                  activeView === item.id
                    ? 'bg-secondary text-white'
                    : 'hover:bg-light-gray'
                }`}
              >
                <span className={!isCollapsed ? 'ms-3' : ''}>{item.icon}</span>
                {!isCollapsed && <span className="font-semibold">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-3 rounded-lg bg-secondary text-white hover:bg-teal-600 transition-colors duration-200"
          aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          <SidebarToggleIcon isCollapsed={isCollapsed} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;