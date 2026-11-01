export type AuthoringAssessmentStatus = 'DRAFT' | 'READY' | 'ARCHIVED';

export type QuestionType = 'MCQ' | 'SCENARIO' | 'PRACTICAL';

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface AuthoringRubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
  description?: string;
}

export interface AuthoringQuestionItem {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  domainCode: string; // '01'..'05'
  domainTitle?: string;
  // MCQ fields
  options?: MCQOption[];
  // Scenario fields
  scenarioContext?: string;
  // Practical fields
  practicalGuide?: string;
  rubric?: AuthoringRubricCriterion[];
}

export interface AuthoringAssessment {
  id: string;
  code: string;
  title: string;
  description: string;
  selectedDomains: number[];
  durationMinutes: number;
  passingScore: number;
  status: AuthoringAssessmentStatus;
  questions: AuthoringQuestionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthoringSessionConfig {
  deploymentType: 'CLASS' | 'LIVE_ROOM';
  classId?: string;
  deadline?: string;
  pin?: string;
  durationMinutes: number;
  isResultVisibleImmediately: boolean;
  proctoringEnabled?: boolean;
}
