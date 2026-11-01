export type SubmissionStatusKey = 'todo' | 'progress' | 'wait' | 'done' | 'resubmit';

export type SubmissionTabKey = 'all' | 'todo' | 'wait' | 'done';

export type SubmissionViewMode = 'list' | 'detail' | 'submit' | 'tracking' | 'result';

export interface RubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
  awardedPoints?: number;
}

export interface AssignmentAttachment {
  name: string;
  size: string;
  url: string;
  type?: string;
}

export interface PersonalSubmissionItem {
  id: string; // class_assignment id
  assessmentId: string;
  itemId?: string;
  title: string;
  className: string;
  classCode: string;
  evaluatorName: string;
  description: string;
  requirements: string[];
  rubric: RubricCriterion[];
  attachments: AssignmentAttachment[];
  deadline?: string;
  deadlineFormatted: string;
  isOverdue: boolean;
  status: SubmissionStatusKey;
  statusLabel: string;
  submissionId?: string;
  submittedAt?: string;
  submittedAtFormatted?: string;
  submittedVersion?: number;
  submittedFile?: {
    name: string;
    size: string;
    storagePath?: string;
  };
  studentNote?: string;
  officialScore?: number;
  maxScore?: number;
  evaluatorFeedback?: string;
  evaluatorGradedAt?: string;
  isPassed?: boolean;
}
