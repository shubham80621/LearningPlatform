import api from './client';
import type { Assignment } from '../types';

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
