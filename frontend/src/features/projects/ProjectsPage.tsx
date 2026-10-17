import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronRight,
  FolderGit2,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { teamsApi } from '@/api/teams';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectCreateModal } from './ProjectCreateModal';
import { formatDate } from '@/utils/formatters';

export const ProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
  });

  const teamMap = new Map<number, string>(teams.map((t) => [t.id, t.name]));

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">Projects</h1>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Organize tasks, collaborate with your teams, and monitor milestones.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          Create Project
        </Button>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md focus:bg-white focus:outline-none focus:border-[#1868DB] transition-all"
          />
        </div>

        <span className="text-xs text-[#6B778C] font-medium hidden sm:inline">
          Showing {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center justify-center">
          <FolderGit2 className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#172B4D] mb-1">
            {search ? 'No matching projects found' : 'No projects created yet'}
          </h3>
          <p className="text-xs text-[#6B778C] max-w-sm mb-5 leading-relaxed">
            {search
              ? 'Try modifying your search query.'
              : 'Create a project within a team to organize workflows, assign issues, and track progress.'}
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const teamName = teamMap.get(project.team_id);

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-card hover:border-[#1868DB] hover:shadow-md transition-all flex flex-col justify-between gap-4 group text-left"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1868DB] flex items-center justify-center group-hover:bg-[#1868DB] group-hover:text-white transition-colors">
                      <FolderGit2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    {teamName && (
                      <span className="text-[11px] font-semibold text-[#42526E] bg-gray-100 px-2 py-0.5 rounded truncate max-w-[140px]">
                        {teamName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors leading-tight">
                    {project.name}
                  </h3>

                  <p className="text-xs text-[#6B778C] line-clamp-2 mt-1.5 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EBECF0] text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.created_at)}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[#1868DB] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Board</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
