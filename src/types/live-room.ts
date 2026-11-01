// ==============================================================================
// NEXA TYPES: LIVE EXAM ROOMS & PARTICIPANTS
// ==============================================================================

export type RoomThemeId = 'minimal_white' | 'space_blue' | 'aurora' | 'dark_professional';

export type RoomStatus =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'ENDED'
  | 'RESULTS_PUBLISHED';

export type ParticipantStatus = 'JOINED' | 'TAKING' | 'SUBMITTED';

export type ConnectionStatus = 'ONLINE' | 'DISCONNECTED';

export type RoomMode = 'OPEN' | 'GROUP_ONLY';

export interface PublishSettings {
  show_score: boolean;
  show_ranking: boolean;
  show_answers: boolean;
  scope: 'ALL' | 'PASSED_ONLY';
}

export interface ExamRoom {
  id: string;
  room_code: string;
  assessment_id: string;
  assessment_title?: string;
  created_by: string;
  organization_id?: string | null;
  title: string;
  room_mode: RoomMode;
  is_active: boolean;
  is_locked: boolean;
  theme_id: RoomThemeId;
  status: RoomStatus;
  allow_late_join: boolean;
  auto_submit_on_timeout: boolean;
  show_pin: boolean;
  system_notifications_enabled: boolean;
  results_published: boolean;
  results_publish_settings: PublishSettings;
  max_participants: number;
  room_description?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  // Computed / Joined fields
  participant_count?: number;
  ready_count?: number;
  submitted_count?: number;
  duration_minutes?: number;
  passing_score?: number;
  question_count?: number;
  author_name?: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  submission_id?: string | null;
  status: ParticipantStatus;
  joined_at: string;
  is_ready: boolean;
  ready_at?: string | null;
  connection_status: ConnectionStatus;
  last_heartbeat_at?: string | null;
  score?: number | null;
  submitted_at?: string | null;
  answers_count: number;
  total_questions: number;
  // User profile
  full_name?: string;
  student_code?: string;
  avatar_url?: string | null;
  initials?: string;
}

export interface RoomAnnouncement {
  id: string;
  room_id: string;
  created_by: string;
  content: string;
  target_audience: string;
  created_at: string;
}

export interface RoomThemeConfig {
  id: RoomThemeId;
  name: string;
  tagline: string;
  description: string;
  previewBgClass: string;
  badgeClass: string;
  isDark: boolean;
}

export const ROOM_THEMES: Record<RoomThemeId, RoomThemeConfig> = {
  minimal_white: {
    id: 'minimal_white',
    name: 'Trắng tối giản',
    tagline: 'Mặc định',
    description: 'Giao diện sáng, hiện đại, đơn giản và dễ theo dõi.',
    previewBgClass: 'bg-white border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    isDark: false,
  },
  space_blue: {
    id: 'space_blue',
    name: 'Space Blue',
    tagline: 'Vũ trụ số',
    description: 'Phong cách không gian chuyên nghiệp, hiện đại và cuốn hút.',
    previewBgClass: 'bg-slate-900 border-sky-800',
    badgeClass: 'bg-sky-950 text-sky-300 border-sky-800',
    isDark: true,
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Cực quang',
    description: 'Giao diện rực rỡ với hiệu ứng cực quang, trẻ trung và sinh động.',
    previewBgClass: 'bg-indigo-950 border-purple-800',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-800',
    isDark: true,
  },
  dark_professional: {
    id: 'dark_professional',
    name: 'Dark Professional',
    tagline: 'Chuyên nghiệp',
    description: 'Tông tối sang trọng, tập trung cao độ và chuẩn mực.',
    previewBgClass: 'bg-zinc-950 border-zinc-800',
    badgeClass: 'bg-zinc-900 text-zinc-300 border-zinc-800',
    isDark: true,
  },
};
