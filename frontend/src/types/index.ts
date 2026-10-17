// User & Role Types
export type UserRole = 'admin' | 'manager' | 'member';
export type MembershipRole = 'manager' | 'member';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RoleUpdate {
  role: UserRole;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  demo_registration_code?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface DecodedJWTPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  iss?: string;
  aud?: string;
  typ?: string;
  jti?: string;
}

// Task Types
export type TaskStatus = 'todo' | 'pending' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  assignee_id?: number | null;
  project_id?: number | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  assignee_id?: number | null;
  project_id?: number | null;
}

export interface TaskResponse {
  id: number;
  user_id: number;
  creator_id: number;
  assignee_id: number | null;
  project_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskQueryParams {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number;
  project_id?: number;
  deadline_before?: string;
  deadline_after?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'deadline' | 'title' | 'status' | 'priority';
  sort_order?: 'asc' | 'desc';
}

// Team Types
export interface TeamCreate {
  name: string;
  description?: string | null;
}

export interface TeamUpdate {
  name?: string;
  description?: string | null;
}

export interface TeamResponse {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberCreate {
  user_id: number;
  role?: MembershipRole;
}

export interface TeamMemberResponse {
  id: number;
  team_id: number;
  user_id: number;
  role: MembershipRole;
  created_at: string;
}

// Project Types
export interface ProjectCreate {
  team_id: number;
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
}

export interface ProjectResponse {
  id: number;
  team_id: number;
  owner_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberCreate {
  user_id: number;
  role?: MembershipRole;
}

export interface ProjectMemberResponse {
  id: number;
  project_id: number;
  user_id: number;
  role: MembershipRole;
  created_at: string;
}

// Comment Types
export interface CommentCreate {
  body: string;
}

export interface CommentUpdate {
  body: string;
}

export interface CommentResponse {
  id: number;
  task_id: number;
  author_id: number;
  body: string;
  created_at: string;
  updated_at: string;
}

// Activity Types
export interface ActivityResponse {
  id: number;
  actor_id: number | null;
  task_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  metadata_json: Record<string, any>;
  created_at: string;
}

// Notification Types
export interface NotificationResponse {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: number | null;
  task_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Attachment Types
export interface AttachmentResponse {
  id: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  storage_provider: string;
  uploader_id: number;
  task_id: number;
  created_at: string;
}

// AI Types
export interface AITaskCreateRequest {
  prompt: string;
  project_id?: number | null;
  assignee_id?: number | null;
}

export type AITaskCreateResponse = TaskResponse;

export interface AISummaryResponse {
  summary: string;
}

export interface AIPrioritySuggestionResponse {
  priority: TaskPriority;
  explanation: string;
}

// WebSocket Event Types
export interface WsBaseEvent {
  type: string;
  [key: string]: any;
}
