
import React from 'react';
import { ViewType } from '../types';
import { DashboardIcon, BookingsIcon, HospitalityIcon, RoomsIcon, AdminIcon, SidebarToggleIcon, RefreshIcon, TodayIcon } from './icons/Icons';

interface NavItem {
  id: string;
  label: string;
  // Fix for: Cannot find namespace 'JSX'.
  icon: React.ReactElement;
}

interface SidebarProps {
  navItems: Omit<NavItem, 'icon'>[];
  activeView: ViewType;
  setView: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isRefreshing: boolean;
  isMobile: boolean;
  isMobileMenuOpen: boolean;
}

// Fix for: Cannot find namespace 'JSX'.
const iconMap: { [key: string]: React.ReactElement } = {
    dashboard: <DashboardIcon />,
    bookings: <BookingsIcon />,
    today: <TodayIcon />,
    hospitality: <HospitalityIcon />,
    rooms: <RoomsIcon />,
    admin: <AdminIcon />,
};

const Sidebar: React.FC<SidebarProps> = ({ navItems, activeView, setView, isCollapsed, onToggle, isRefreshing, isMobile, isMobileMenuOpen }) => {

  const sidebarContent = (
    <div className={`bg-background text-text-dark flex flex-col p-4 space-y-4 shadow-lg transition-all duration-300 h-full ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
                <span className={!isCollapsed ? 'ms-3' : ''}>{iconMap[item.id]}</span>
                {!isCollapsed && <span className="font-semibold">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200 hidden md:block">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-3 rounded-lg bg-secondary text-white hover:bg-teal-600 transition-colors duration-200"
          aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          <SidebarToggleIcon isCollapsed={isCollapsed} />
        </button>
        {!isCollapsed && (
            <div className="text-center text-xs text-primary pt-3">
                <p>powerby : Abdelaziz Frhat</p>
                <p>itsupport@alrajhihum.org</p>
            </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onToggle}
          aria-hidden="true"
        ></div>
        {/* Mobile Sidebar */}
        <aside className={`fixed top-0 right-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="relative hidden md:block">
        {sidebarContent}
    </aside>
  );
};

export default Sidebar;
