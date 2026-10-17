import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { teamsApi } from '@/api/teams';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TeamCreateModal } from './TeamCreateModal';
import { formatDate } from '@/utils/formatters';

export const TeamsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
  });

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">Teams</h1>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Create cross-functional teams to collaborate across projects and tasks.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
        >
          Create Team
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md focus:bg-white focus:outline-none focus:border-[#1868DB] transition-all"
          />
        </div>

        <span className="text-xs text-[#6B778C] font-medium hidden sm:inline">
          Showing {filteredTeams.length} of {teams.length} teams
        </span>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#172B4D] mb-1">
            {search ? 'No matching teams found' : 'No teams created yet'}
          </h3>
          <p className="text-xs text-[#6B778C] max-w-sm mb-5 leading-relaxed">
            {search
              ? 'Try modifying your search query.'
              : 'Create a team to manage collaborators and create team-owned projects.'}
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-card hover:border-[#1868DB] hover:shadow-md transition-all flex flex-col justify-between gap-4 group text-left"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4 stroke-[2.5]" />
                </div>

                <h3 className="text-sm font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors leading-tight">
                  {team.name}
                </h3>

                <p className="text-xs text-[#6B778C] line-clamp-2 mt-1.5 leading-relaxed">
                  {team.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EBECF0] text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatDate(team.created_at)}</span>
                </span>
                <div className="flex items-center gap-1 text-[#1868DB] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Manage Team</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <TeamCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
