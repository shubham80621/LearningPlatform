import api from './client';
import type {
  Assignment,
  LearnerAssignment,
  LearnerProgressSummary,
  LearnerWatchSession,
  Paginated,
} from '../types';

export type ListMyAssignmentsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'assigned' | 'in_progress' | 'completed' | 'continue';
};

export async function listMyAssignments(params: ListMyAssignmentsParams = {}) {
  const search = params.search?.trim();
  const { data } = await api.get<Paginated<LearnerAssignment>>('/assignments/me', {
    params: {
      ...params,
      status: params.status === 'all' ? undefined : params.status,
      search: search || undefined,
    },
  });
  return data;
}

export async function getMyProgressSummary() {
  const { data } = await api.get<LearnerProgressSummary>('/assignments/me/summary');
  return data;
}

export async function getMyAssignment(id: string) {
  const { data } = await api.get<LearnerWatchSession>(`/assignments/me/${id}`);
  return data;
}

export async function saveMyProgress(
  id: string,
  payload: { lastWatchedTimestamp: number },
) {
  const { data } = await api.patch<{
    id: string;
    status: string;
    lastWatchedTimestamp: number;
    completionPercentage: number;
    completedAt?: string | null;
  }>(`/assignments/me/${id}/progress`, payload);
  return data;
}

export async function submitMyAnswer(
  id: string,
  payload: {
    questionId: string;
    selectedOptionIndexes?: number[];
    shortAnswer?: string;
  },
) {
  const { data } = await api.post<LearnerWatchSession>(
    `/assignments/me/${id}/answers`,
    payload,
  );
  return data;
}

export async function listLearnerAssignments(learnerId: string) {
  const { data } = await api.get<Assignment[]>(`/assignments/learner/${learnerId}`);
  return data;
}

export async function assignVideosToLearner(payload: {
  learnerId: string;
  videoIds: string[];
}) {
  const { data } = await api.post<Assignment[]>('/assignments', payload);
  return data;
}

export async function removeAssignment(id: string) {
  const { data } = await api.delete<{ id: string }>(`/assignments/${id}`);
  return data;
}
