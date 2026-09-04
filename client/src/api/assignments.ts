import api from './client';
import type {
  Assignment,
  LearnerAssignment,
  LearnerWatchSession,
} from '../types';

export async function listMyAssignments() {
  const { data } = await api.get<LearnerAssignment[]>('/assignments/me');
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
