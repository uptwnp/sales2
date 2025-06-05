import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, CheckSquare, Calendar, X, PhoneCall, Users2, History, Search, Building2 } from 'lucide-react';
import classNames from 'classnames';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, companyName }) => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Leads', icon: <Users size={18} />, path: '/leads' },
    { name: 'Tasks', icon: <CheckSquare size={18} />, path: '/tasks' },
    { name: 'Find Match', icon: <Search size={18} />, path: '/find-match' },
    { name: 'Follow-ups', icon: <PhoneCall size={18} />, path: '/follow-ups' },
    { name: 'To Schedule Visit', icon: <Building2 size={18} />, path: '/to-schedule-visit' },
     { name: 'My Meetings', icon: <Users2 size={18} />, path: '/meetings' },

    { name: 'Activities', icon: <History size={18} />, path: '/activities' },
    { name: 'Calendar', icon: <Calendar size={18} />, path: '/calendar' },
  ];

  return (
    <div 
      className={classNames(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
        {
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen
        }
      )}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold text-blue-800">{companyName}</h1>
        <button 
          onClick={onClose}
          className="md:hidden rounded-full p-1 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="mt-4 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={classNames(
              'sidebar-item',
              location.pathname === item.path 
                ? 'sidebar-item-active' 
                : 'sidebar-item-inactive'
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold">
            {companyName[0]}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Real Estate CRM</p>
            <p className="text-xs text-gray-500">v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;