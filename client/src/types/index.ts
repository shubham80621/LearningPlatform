export type UserRole = 'admin' | 'learner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedVideos?: number;
  questions?: number;
  completed?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  isPublished: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredUpload {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export type QuestionType = 'single' | 'multiple' | 'short';

export interface Question {
  id: string;
  videoId: string;
  timestamp: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndexes: number[];
  correctAnswer: string;
}

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';

export interface AssignmentVideoSummary {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  duration: number;
  isPublished?: boolean;
}

export interface LearnerWatchQuestion {
  id: string;
  timestamp: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  answered: boolean;
  isCorrect: boolean | null;
  selectedOptionIndexes?: number[];
  shortAnswer?: string;
  correctOptionIndexes?: number[];
  correctAnswer?: string;
  answeredAt?: string | null;
}

export interface LearnerWatchSession {
  id: string;
  videoId: string;
  status: AssignmentStatus;
  lastWatchedTimestamp: number;
  completionPercentage: number;
  completedAt?: string | null;
  stats: AssignmentStats;
  questions: LearnerWatchQuestion[];
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;
  };
}

/** Learner home-feed item (no answer keys). */
export interface LearnerAssignment {
  id: string;
  videoId: string;
  status: AssignmentStatus;
  lastWatchedTimestamp: number;
  completionPercentage: number;
  completedAt?: string | null;
  questionCount: number;
  answeredCount: number;
  stats?: AssignmentStats;
  createdAt?: string;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    duration: number;
  };
}

export interface AssignmentQuestionProgress {
  questionId: string;
  timestamp: number;
  type: QuestionType | string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  answered: boolean;
  isCorrect: boolean | null;
  learnerAnswer: string | null;
  answeredAt: string | null;
}

export interface AssignmentStats {
  totalQuestions: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
}

export interface Assignment {
  id: string;
  learnerId: string;
  videoId: string;
  status: AssignmentStatus;
  lastWatchedTimestamp: number;
  completionPercentage: number;
  completedAt?: string | null;
  responseCount: number;
  createdAt?: string;
  video: AssignmentVideoSummary | null;
  stats?: AssignmentStats;
  questions?: AssignmentQuestionProgress[];
}
