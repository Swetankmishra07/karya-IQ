import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  CheckSquare,
  FolderGit2,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAICreateTask?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenAICreateTask }) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/tasks',
      label: 'My Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: <FolderGit2 className="w-4 h-4" />,
    },
    {
      to: '/teams',
      label: 'Teams',
      icon: <Users className="w-4 h-4" />,
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
    },
    {
      to: '/settings',
      label: 'Profile & Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#091E42]/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed lg:static top-14 bottom-0 left-0 z-40 w-64 bg-[#FAFBFC] border-r border-[#DFE1E6] flex flex-col justify-between transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          {/* Mobile close header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#EBECF0] lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section: Workspace views */}
          <div className="mb-6">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6B778C] mb-2">
              Workspace
            </p>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors duration-150',
                      isActive
                        ? 'bg-[#DEEBFF] text-[#0747A6]'
                        : 'text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D]'
                    )
                  }
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Section: AI Collaboration Spotlight */}
          <div className="mt-2 p-3 bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-lg border border-blue-100/80">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-[#172B4D]">AI Assistance</span>
            </div>
            <p className="text-[11px] text-[#6B778C] leading-relaxed mb-3">
              Generate tasks from plain natural language or get AI-powered priority suggestions.
            </p>
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                onOpenAICreateTask?.();
              }}
              className="w-full py-1.5 px-2.5 text-xs font-semibold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 rounded shadow-xs transition-colors"
            >
              Draft with AI
            </button>
          </div>
        </div>

        {/* User Workspace Info at Bottom */}
        <div className="p-3 border-t border-[#DFE1E6] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-[#172B4D] truncate">
                {user?.username || 'Team Member'}
              </span>
              <span className="text-[11px] text-gray-500 capitalize">
                {user?.role || 'member'} access
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />
          </div>
        </div>
      </aside>
    </>
  );
};
