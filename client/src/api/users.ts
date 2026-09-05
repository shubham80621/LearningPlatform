import api from './client';
import type { User } from '../types';

export type ListLearnersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getLearner(id: string) {
  const { data } = await api.get<User>(`/users/learners/${id}`);
  return data;
}

export async function updateLearner(
  id: string,
  payload: { name: string; email: string; password?: string },
) {
  const { data } = await api.patch<User>(`/users/learners/${id}`, payload);
  return data;
}

export async function createLearner(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<User>('/users/learners', payload);
  return data;
}
