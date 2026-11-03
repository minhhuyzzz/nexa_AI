export type GroupType = 'CLASS' | 'DEPARTMENT' | 'PROJECT_GROUP';
export type ClassStatus = 'ACTIVE' | 'UPCOMING' | 'ARCHIVED';

export type RoleInClass = 'STUDENT' | 'CLASS_LEADER' | 'VICE_LEADER' | 'ASSISTANT_TEACHER';

export interface OrgClassItem {
  id: string;
  name: string;
  classCode: string;
  description?: string | null;
  groupType: GroupType;
  status: ClassStatus;
  term?: string | null;
  instructorId?: string | null;
  instructorName?: string | null;
  maxCapacity: number;
  settings?: {
    allowJoinCode?: boolean;
    isActiveListed?: boolean;
    createResourceFolder?: boolean;
  };
  createdAt: string;
  membersCount: number;
  assignmentsCount: number;
  participationRate?: number | null;
  pendingGradingCount?: number;
}

export interface ClassMemberItem {
  id: string;
  userId: string;
  fullName: string;
  studentId: string;
  email: string;
  roleInClass: RoleInClass;
  subGroup?: string | null;
  participationRate: number;
  joinedAt: string;
  lastActiveAt?: string | null;
}

export interface ClassAssignmentItem {
  id: string;
  assessmentId: string;
  title: string;
  durationMinutes: number;
  passingScore: number;
  startTime?: string | null;
  deadline?: string | null;
  timezone: string;
  allowLateSubmission: boolean;
  reminderBeforeHours: number;
  aiGradingEnabled: boolean;
  shuffleQuestions: boolean;
  immediateResults: boolean;
  requireEvidence: boolean;
  allowedEvidenceTypes: string[];
  maxEvidenceMb: number;
  estimatedAiCredits: number;
  status: 'PUBLISHED' | 'DRAFT' | 'CLOSED';
  createdAt: string;
}

export interface ClassScheduleItem {
  id: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  timeRange: string;
  statusColor: 'blue' | 'amber' | 'purple' | 'emerald';
}
