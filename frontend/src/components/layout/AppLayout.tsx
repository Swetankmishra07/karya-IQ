import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal';
import { AITaskCreateModal } from '@/features/ai/AITaskCreateModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAICreateTaskOpen, setIsAICreateTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // If not on /tasks, navigate to /tasks with search query
    if (window.location.pathname !== '/tasks') {
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Persistent Jira-style Top Navigation */}
      <Navbar
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onOpenAICreateTask={() => setIsAICreateTaskOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenAICreateTask={() => setIsAICreateTaskOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      {/* Global AI Create Task Modal */}
      <AITaskCreateModal
        isOpen={isAICreateTaskOpen}
        onClose={() => setIsAICreateTaskOpen(false)}
        onOpenManualCreate={() => {
          setIsAICreateTaskOpen(false);
          setIsCreateTaskOpen(true);
        }}
      />
    </div>
  );
};
