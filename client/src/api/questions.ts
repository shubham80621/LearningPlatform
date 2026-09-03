import api from './client';
import type { Question, QuestionType } from '../types';

export async function listQuestions(videoId: string) {
  const { data } = await api.get<Question[]>(`/videos/${videoId}/questions`);
  return data;
}

export async function createQuestion(
  videoId: string,
  payload: {
    timestamp: number;
    type: QuestionType;
    questionText: string;
    options?: string[];
    correctOptionIndexes?: number[];
    correctAnswer?: string;
  },
) {
  const { data } = await api.post<Question>(`/videos/${videoId}/questions`, payload);
  return data;
}

export async function updateQuestion(
  videoId: string,
  id: string,
  payload: {
    timestamp: number;
    type: QuestionType;
    questionText: string;
    options?: string[];
    correctOptionIndexes?: number[];
    correctAnswer?: string;
  },
) {
  const { data } = await api.patch<Question>(
    `/videos/${videoId}/questions/${id}`,
    payload,
  );
  return data;
}

export async function deleteQuestion(videoId: string, id: string) {
  const { data } = await api.delete<{ id: string; deleted: boolean }>(
    `/videos/${videoId}/questions/${id}`,
  );
  return data;
}
