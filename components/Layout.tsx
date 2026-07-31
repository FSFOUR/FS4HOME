import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ICONS } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: ICONS.Dashboard, label: 'Overview' },
    { path: '/schedule', icon: ICONS.Schedule, label: 'Schedule' },
    { path: '/finance', icon: ICONS.Finance, label: 'Finance' },
    { path: '/lifestyle', icon: ICONS.Food, label: 'Lifestyle' },
    { path: '/zakat', icon: ICONS.Zakat, label: 'Donation' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065B33] to-[#0F8D4E] text-white">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Navigation - simplified for now */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/10 px-2 pb-6 pt-2 flex justify-around items-center md:relative md:flex-col md:w-64 md:border-t-0 md:border-r md:border-white/10 md:px-4 md:py-8 z-[100]">
           {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = location.pathname === item.path;
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`flex flex-col items-center gap-1 py-2 px-3 md:flex-row md:gap-3 md:px-5 md:py-3.5 md:w-full md:rounded-2xl transition-all duration-300 ${
                   isActive ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'
                 }`}
               >
                 <Icon className="w-6 h-6" />
                 <span className="text-[9px] md:text-sm font-bold uppercase md:normal-case">{item.label}</span>
               </Link>
             );
           })}
        </nav>
        
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
