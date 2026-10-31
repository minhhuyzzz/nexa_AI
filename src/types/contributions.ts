export interface ContributionFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface ContributionItem {
  id: string;
  code: string;
  title: string;
  domain: string;
  questionType: 'PRACTICAL_FILE' | 'SCENARIO' | 'MCQ' | 'DIGITAL_LINK';
  difficulty: 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  status: 'pending' | 'approved' | 'needs_revision' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  pointsRewarded?: number;
  prompt: string;
  solutionNotes: string;
  adminFeedback?: string;
  authorName?: string;
  attachedFiles: ContributionFile[];
}
