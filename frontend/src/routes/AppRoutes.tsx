import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const LandingPage = React.lazy(() =>
  import('@/features/landing/LandingPage').then((module) => ({ default: module.LandingPage }))
);
const LoginPage = React.lazy(() =>
  import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('@/features/auth/RegisterPage').then((module) => ({ default: module.RegisterPage }))
);
const AppLayout = React.lazy(() =>
  import('@/components/layout/AppLayout').then((module) => ({ default: module.AppLayout }))
);
const TaskListPage = React.lazy(() =>
  import('@/features/tasks/TaskListPage').then((module) => ({ default: module.TaskListPage }))
);
const ProjectsPage = React.lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage }))
);
const ProjectDetailPage = React.lazy(() =>
  import('@/features/projects/ProjectDetailPage').then((module) => ({
    default: module.ProjectDetailPage,
  }))
);
const TeamsPage = React.lazy(() =>
  import('@/features/teams/TeamsPage').then((module) => ({ default: module.TeamsPage }))
);
const TeamDetailPage = React.lazy(() =>
  import('@/features/teams/TeamDetailPage').then((module) => ({ default: module.TeamDetailPage }))
);
const NotificationsPage = React.lazy(() =>
  import('@/features/notifications/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  }))
);
const ProfilePage = React.lazy(() =>
  import('@/features/profile/ProfilePage').then((module) => ({ default: module.ProfilePage }))
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-sm font-medium text-slate-600">
          <span role="status">Loading KaryaIQ…</span>
        </main>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated Workspace Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="tasks" element={<TaskListPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:id" element={<TeamDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
