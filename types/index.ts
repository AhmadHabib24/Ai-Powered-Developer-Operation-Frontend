export type Permission = string;

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string;
  experience_level: string;
  availability_status: string;
  current_work_mode?: string | null;
  weekly_capacity_hours: number | string;
  bio?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  workload_hours?: number | string;
  roles?: string[];
  permissions?: Permission[];
  skills?: UserSkill[];
}

export interface UserSkill {
  id: number;
  name: string;
  slug: string;
  category: string;
  level: number;
  years_experience: number | string;
}

export interface AccessRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  users_count?: number;
  permissions: string[];
}

export interface CatalogPermission {
  id: number;
  name: string;
  slug: string;
  group: string;
  description?: string | null;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  lead?: User | null;
  members?: User[];
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  health: "green" | "yellow" | "red";
  health_reason?: string | null;
  start_date?: string | null;
  deadline?: string | null;
  repository_url?: string | null;
  auto_assign_enabled: boolean;
  ai_permission_mode: string;
  ai_review_enabled?: boolean;
  auto_block_on_severity?: string | null;
  owner?: User;
  team?: Team | null;
  members?: User[];
  rules?: ProjectRule[];
  tasks_count?: number;
  completed_tasks_count?: number;
  overdue_tasks_count?: number;
}

export interface TaskAssignment {
  id: number;
  status: "pending" | "accepted" | "declined" | string;
  assigned_at?: string | null;
  responded_at?: string | null;
  assigned_by?: User | null;
}

export interface TaskAttachment {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  parent_id?: number | null;
  type: string;
  title: string;
  description?: string | null;
  acceptance_criteria?: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  estimated_hours?: number | string | null;
  actual_hours?: number | string;
  complexity?: string | null;
  due_date?: string | null;
  is_overdue?: boolean;
  technical_notes?: string | null;
  assignee?: User | null;
  suggested_assignee?: User | null;
  assignment_confidence?: number | string | null;
  assignment_reason?: string | null;
  assignment_status?: "pending" | "accepted" | "declined" | string | null;
  assignment?: TaskAssignment | null;
  project?: { id: number; name: string; status?: string | null } | null;
  creator?: User | null;
  comments?: { id: number; body: string; user?: User; created_at: string }[];
  attachments?: TaskAttachment[];
}

export interface RequirementDocument {
  id: number;
  project_id: number;
  original_name: string;
  extension: string;
  size_bytes: number;
  extraction_status: string;
  extraction_error?: string | null;
  has_text: boolean;
  created_at: string;
}

export interface RequirementTaskDraft {
  title: string;
  description?: string;
  priority: Task["priority"];
  estimated_hours: number;
  complexity?: string;
}

export interface RequirementStoryDraft {
  title: string;
  as_a?: string;
  i_want?: string;
  so_that?: string;
  acceptance_criteria?: string;
  tasks: RequirementTaskDraft[];
}

export interface RequirementFeatureDraft {
  name: string;
  description?: string;
  stories: RequirementStoryDraft[];
}

export interface RequirementModuleDraft {
  name: string;
  description?: string;
  features: RequirementFeatureDraft[];
}

export interface RequirementAnalysis {
  id: number;
  project_id: number;
  document_id: number;
  status: string;
  summary?: string | null;
  complexity?: string | null;
  structured_json?: { summary?: string; complexity?: string; modules: RequirementModuleDraft[] } | null;
  error?: string | null;
  committed_at?: string | null;
  document?: RequirementDocument;
}

export interface ProjectRule {
  id: number;
  project_id: number;
  category: string;
  title: string;
  rule_text: string;
  stack: string;
  is_active: boolean;
  sort_order: number;
}

export interface CodeReviewFinding {
  id: number;
  code_review_id: number;
  severity: "critical" | "high" | "medium" | "low" | "suggestion" | string;
  category: string;
  file_path?: string | null;
  line_start?: number | null;
  line_end?: number | null;
  issue: string;
  why_it_matters?: string | null;
  recommendation?: string | null;
  is_resolved: boolean;
  resolution: string;
  resolved_at?: string | null;
  resolver?: { id: number; name: string } | null;
}

export interface CodeReview {
  id: number;
  project_id: number;
  repository_id?: number | null;
  pull_request_id?: number | null;
  commit_sha?: string | null;
  branch?: string | null;
  status: string;
  trigger: string;
  summary?: string | null;
  provider?: string | null;
  blocked: boolean;
  error?: string | null;
  files_reviewed?: string[] | null;
  open_findings_count?: number | null;
  findings?: CodeReviewFinding[];
  pull_request?: { id: number; number: number; title: string; status: string; head_branch?: string | null } | null;
  created_at: string;
  updated_at?: string;
}

export interface AssignmentRecommendation {
  task_id: number;
  auto_assign_enabled: boolean;
  auto_assigned: boolean;
  recommended: { user_id: number; name: string; confidence: number; reason: string } | null;
  alternatives: Array<{ user_id: number; name: string; confidence: number; reason: string }>;
}

export interface Paginated<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface CtoDashboard {
  totals: {
    projects: number;
    active_developers: number;
    active_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    time_tracked_hours: number;
    git_commits_week: number;
    ai_reviews_open: number;
    performance_points_week?: number;
  };
  projects: Array<{
    id: number;
    name: string;
    status: string;
    health: Project["health"];
    health_reason: string;
    deadline?: string | null;
  }>;
  alerts: Array<{ level: string; message: string }>;
  insights: string[];
  task_status: Record<string, number>;
}

export interface TimeSession {
  id: number;
  task_id: number;
  project_id: number;
  work_mode: "office" | "remote";
  status: "running" | "paused" | "stopped";
  started_at: string;
  paused_at?: string | null;
  stopped_at?: string | null;
  elapsed_seconds: number;
  task?: { id: number; title: string; status?: string } | null;
  project?: { id: number; name: string } | null;
}

export interface TimeAdjustment {
  id: number;
  delta_seconds: number;
  reason: string;
  created_at: string;
}

export interface TimeEntry {
  id: number;
  user_id: number;
  task_id: number;
  project_id: number;
  work_mode: "office" | "remote";
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  adjustment_seconds: number;
  billed_seconds: number;
  source: "timer" | "manual";
  note?: string | null;
  task?: { id: number; title: string; project_id?: number } | null;
  user?: User | null;
  adjustments?: TimeAdjustment[];
  created_at: string;
}

export interface TimeSummary {
  user_id: number;
  from: string;
  to: string;
  seconds: number;
  hours: number;
  today_seconds: number;
  week_seconds: number;
  month_seconds: number;
  task_count?: number;
  average_seconds?: number;
  average_hours?: number;
  by_task?: Array<{
    task_id: number;
    project_id: number;
    task?: string | null;
    project?: string | null;
    estimated_hours?: number | string | null;
    sessions: number;
    seconds: number;
    hours: number;
  }>;
}

export interface DeveloperDashboard {
  tasks: {
    assigned: number;
    today: Task[];
    in_progress: Task[];
    blocked: number;
    pending_assignments?: Task[];
    recent: Task[];
  };
  timer: {
    active: TimeSession | null;
    today_seconds: number;
    week_seconds: number;
    work_mode: "office" | "remote";
    timer_required: boolean;
  };
  performance: {
    score: number | null;
    points: number;
    points_all_time?: number;
    breakdown?: Record<string, unknown> | null;
    achievements: Array<{ slug?: string | null; name?: string | null; description?: string | null; earned_at?: string | null }>;
  };
  git: { commits_week: number; open_prs: number; open_findings: number };
  workload_hours: number;
}

export interface GitProviderStatus {
  name: string;
  configured: boolean;
  token_configured?: boolean;
  app_configured: boolean;
  default: boolean;
  organization?: string | null;
  organization_url?: string | null;
  install_url?: string | null;
}

export interface GitIntegration {
  id: number;
  provider: string;
  organization_name?: string | null;
  provider_account_id?: string | null;
  status: string;
  connected: boolean;
}

export interface GitRemoteRepository {
  external_id: string;
  full_name: string;
  default_branch: string;
  html_url?: string | null;
  private?: boolean;
  description?: string | null;
  language?: string | null;
  pushed_at?: string | null;
}

export interface GitOrgRepository extends GitRemoteRepository {
  linked: boolean;
  webhook_status?: string | null;
  open_pull_requests: number;
  reviews_count: number;
  linked_project?: {
    id: number;
    name: string;
    slug?: string;
    ai_review_enabled?: boolean;
  } | null;
}

export interface GitOrganizationCatalog {
  organization?: string | null;
  organization_url?: string | null;
  oauth_configured: boolean;
  token_configured: boolean;
  connected: boolean;
  integration_id?: number | null;
  list_error?: string | null;
  repository_count: number;
  repositories: GitOrgRepository[];
}

export interface GitRemotePullRequest {
  external_id: string;
  number: number;
  title: string;
  author_login?: string | null;
  status: string;
  draft: boolean;
  base_branch?: string | null;
  head_branch?: string | null;
  head_sha?: string | null;
  html_url?: string | null;
  opened_at?: string | null;
}

export interface GitRemoteBranch {
  name: string;
  sha: string;
  protected: boolean;
  default: boolean;
}

export interface GitRepository {
  id: number;
  project_id: number;
  integration_id: number;
  provider: string;
  external_id: string;
  full_name: string;
  default_branch: string;
  html_url?: string | null;
  is_active: boolean;
  webhook_status?: string;
  last_event_at?: string | null;
}

export interface GitCommit {
  id: number;
  sha: string;
  message: string;
  author_name?: string | null;
  author_email?: string | null;
  branch?: string | null;
  committed_at?: string | null;
  additions: number;
  deletions: number;
  user?: { id: number; name: string; email: string } | null;
  task?: { id: number; title: string; status: string } | null;
}

export interface GitPullRequest {
  id: number;
  number: number;
  title: string;
  status: string;
  draft: boolean;
  author_login?: string | null;
  head_branch?: string | null;
  base_branch?: string | null;
  head_sha?: string | null;
  additions: number;
  deletions: number;
  opened_at?: string | null;
  author?: { id: number; name: string } | null;
  task?: { id: number; title: string; status: string } | null;
}

export interface GitIdentity {
  id: number;
  provider: string;
  login: string;
  email?: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
  read_at?: string | null;
  created_at?: string;
}

export interface PerformanceRule {
  id: number;
  name: string;
  slug: string;
  points: number;
  is_active: boolean;
  conditions?: { event?: string } | null;
}

export interface PerformancePoint {
  id: number;
  user?: { id: number; name: string } | null;
  awarded_by?: { id: number; name: string } | null;
  rule?: { id: number; name: string; slug: string } | null;
  points: number;
  reason: string;
  source_type?: string | null;
  source_id?: number | null;
  occurred_at?: string;
  created_at?: string;
}

export interface PerformanceSnapshot {
  score: number | null;
  breakdown?: Record<string, unknown> | null;
  points: number;
  points_all_time: number;
  achievements: Array<{ slug?: string | null; name?: string | null; description?: string | null; earned_at?: string | null }>;
}

export interface PerformanceAnalytics {
  developers: Array<{
    user: { id: number; name: string };
    score: number | null;
    points: number;
    completed: number;
    overdue: number;
  }>;
  points_by_week: Array<{ week: string; points: number }>;
  org_points_week: number;
  scored_developers: number;
}

export interface WeeklyReport {
  id: number;
  user_id: number;
  week_start: string;
  payload?: Record<string, unknown> | null;
  ai_summary?: string | null;
  status: string;
  user?: { id: number; name: string };
}

export interface MonthlySummary {
  period: { from: string; to: string };
  completed_tasks: number;
  points: number;
  developers: Array<{
    user: { id: number; name: string };
    completed: number;
    points: number;
    score: number | null;
    hours: number;
  }>;
  note: string;
}

export interface NovaCapabilities {
  provider: string;
  stt: { name: string; configured: boolean };
  tts: { name: string; configured: boolean };
}

export interface NovaToolCall {
  id: number;
  tool_name: string;
  arguments?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  status: string;
}

export interface NovaMessage {
  id: number;
  role: "user" | "assistant" | string;
  content?: string | null;
  meta?: Record<string, unknown> | null;
  tool_calls?: NovaToolCall[];
  created_at?: string;
}

export interface NovaAction {
  id: number;
  tool_name: string;
  command?: string | null;
  input?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  success: boolean;
  permission_mode: string;
  approval_status: string;
  created_at?: string;
}

export interface NovaConversation {
  id: number;
  project_id?: number | null;
  title?: string | null;
  channel: string;
  created_at?: string;
  updated_at?: string;
  messages?: NovaMessage[];
  pending_actions?: NovaAction[];
}

export interface NovaTurn {
  conversation: NovaConversation;
  message: string;
  transcript?: string | null;
  audio_url?: string | null;
  pending_actions: NovaAction[];
  messages: NovaMessage[];
}

export interface Branding {
  app_name: string;
  assistant_name: string;
  logo_url?: string | null;
  voice: {
    listening: string;
    thinking: string;
    speaking: string;
    wake_phrase: string;
  };
}

export type SettingFieldType = "string" | "url" | "int" | "bool" | "secret" | "select" | "logo" | "textarea";

export interface SettingField {
  key: string;
  label: string;
  help?: string | null;
  type: SettingFieldType;
  options?: string[] | null;
  multiline?: boolean;
  value: string | number | boolean | null;
  configured: boolean;
  mask?: string | null;
  placeholder?: string;
}

export interface SettingGroup {
  id: string;
  title: string;
  description: string;
  fields: SettingField[];
}

export interface SettingsCatalog {
  groups: SettingGroup[];
}
