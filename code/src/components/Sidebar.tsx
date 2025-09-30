import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { NavigationItem } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';



interface SidebarProps {
  navigationItems: NavigationItem[];
  //isOpen: boolean;
  //toggleSidebar: () => void;
}



const Sidebar: React.FC<SidebarProps> = ({ navigationItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          📈 P14-9
        </h1>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path; //style/highlight selected path
            
            return (
              <button
                key={item.id}                             //changes URL to match route
                onClick={() => navigate(item.path)}
                className={`sidebar-item w-full text-left ${
                  isActive ? 'active' : ''
                }`}           
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/*refresh"*/}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">
          Last updated: {new Date().toLocaleString()}
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 w-full"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
