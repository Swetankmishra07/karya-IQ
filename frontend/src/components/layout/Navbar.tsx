import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  User as UserIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavbarProps {
  onOpenCreateTask: () => void;
  onOpenAICreateTask: () => void;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateTask,
  onOpenAICreateTask,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getNotifications(true),
    refetchInterval: isConnected ? false : 30000, // Fallback poll if socket disconnected
  });

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-[#DFE1E6] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Hamburger (mobile) + Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/tasks" className="flex items-center gap-2.5 group">
          <BrandLogo compact />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-[#0747A6] px-1.5 py-0.5 rounded leading-none">
                AI
              </span>
            </div>
            <span className="text-[10px] text-[#6B778C] font-medium leading-none hidden sm:inline mt-0.5">
              Collaborative Work Management
            </span>
          </div>
        </Link>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md text-[#172B4D] placeholder-gray-400 transition-all focus:bg-white focus:outline-none focus:border-[#1868DB] focus:ring-2 focus:ring-[#1868DB]/20"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Connection status, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Connection Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200"
          title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time service...'}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-amber-600">Connecting</span>
            </>
          )}
        </div>

        {/* AI Prompt Quick Launcher */}
        <button
          onClick={onOpenAICreateTask}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
          title="Create task using AI Natural Language prompt"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Task Draft</span>
        </button>

        {/* Prominent Create Task Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenCreateTask}
          leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          <span>Create</span>
        </Button>

        {/* Notifications Icon with Unread Badge */}
        <Link
          to="/notifications"
          className="relative p-2 text-gray-500 hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-md transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-600 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white animate-in zoom-in-75">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#1868DB]/30 transition-all focus:outline-none"
            aria-label="User account menu"
          >
            <Avatar
              name={user?.username}
              email={user?.email}
              role={user?.role}
              size="sm"
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-dropdown border border-[#DFE1E6] py-1 z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-4 py-3 border-b border-[#EBECF0]">
                <p className="text-xs text-[#6B778C] font-medium uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-[#172B4D] truncate mt-0.5">
                  {user?.username || 'Team Member'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  Role: {user?.role || 'member'}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span>Profile & Account</span>
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="border-t border-[#EBECF0] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
