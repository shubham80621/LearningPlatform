import api from './client';
import type { User } from '../types';

export async function listLearners() {
  const { data } = await api.get<User[]>('/users/learners');
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
