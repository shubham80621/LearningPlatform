import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  LearnerAssignment,
  LearnerProgressSummary,
  Paginated,
  User,
  Video,
} from '../types';
import type { ListMyAssignmentsParams } from '../api/assignments';
import type { ListVideosParams } from '../api/videos';
import type { ListLearnersParams } from '../api/users';
import {
  infiniteForceRefetch,
  infiniteMerge,
  infiniteSerializeArgs,
} from '../hooks/infiniteQuery';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

/**
 * Server-state cache (RTK Query).
 * List endpoints merge pages into one cache entry (infinite scroll).
 * Dashboard uses refetchOnMountOrArgChange for a silent background refresh.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['VideoList', 'LearnerList', 'MyAssignmentList', 'MyProgressSummary'],
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  endpoints: (builder) => ({
    listVideos: builder.query<Paginated<Video>, ListVideosParams | void>({
      query: (arg) => {
        const params = arg ?? {};
        const search = params.search?.trim();
        return {
          url: '/videos',
          params: {
            page: params.page,
            limit: params.limit,
            status: params.status === 'all' ? undefined : params.status,
            unassignedFor: params.unassignedFor,
            search: search || undefined,
          },
        };
      },
      serializeQueryArgs: infiniteSerializeArgs,
      merge: infiniteMerge,
      forceRefetch: infiniteForceRefetch,
      providesTags: [{ type: 'VideoList', id: 'LIST' }],
    }),

    listLearners: builder.query<Paginated<User>, ListLearnersParams | void>({
      query: (arg) => {
        const params = arg ?? {};
        const search = params.search?.trim();
        return {
          url: '/users/learners',
          params: {
            page: params.page,
            limit: params.limit,
            search: search || undefined,
          },
        };
      },
      serializeQueryArgs: infiniteSerializeArgs,
      merge: infiniteMerge,
      forceRefetch: infiniteForceRefetch,
      providesTags: [{ type: 'LearnerList', id: 'LIST' }],
    }),

    listMyAssignments: builder.query<
      Paginated<LearnerAssignment>,
      ListMyAssignmentsParams | void
    >({
      query: (arg) => {
        const params = arg ?? {};
        const search = params.search?.trim();
        return {
          url: '/assignments/me',
          params: {
            page: params.page,
            limit: params.limit,
            status: params.status === 'all' ? undefined : params.status,
            search: search || undefined,
          },
        };
      },
      serializeQueryArgs: infiniteSerializeArgs,
      merge: infiniteMerge,
      forceRefetch: infiniteForceRefetch,
      providesTags: [{ type: 'MyAssignmentList', id: 'LIST' }],
    }),

    myProgressSummary: builder.query<LearnerProgressSummary, void>({
      query: () => '/assignments/me/summary',
      providesTags: [{ type: 'MyProgressSummary', id: 'SUMMARY' }],
    }),

    setVideoPublished: builder.mutation<
      Video,
      { id: string; isPublished: boolean }
    >({
      query: ({ id, isPublished }) => ({
        url: isPublished ? `/videos/${id}/publish` : `/videos/${id}/unpublish`,
        method: 'POST',
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: updated } = await queryFulfilled;
          for (const args of api.util.selectCachedArgsForQuery(
            getState(),
            'listVideos',
          )) {
            dispatch(
              api.util.updateQueryData('listVideos', args, (draft) => {
                const item = draft.items.find((video) => video.id === id);
                if (item) Object.assign(item, updated);
              }),
            );
          }
        } catch {
          /* caller shows the error */
        }
      },
    }),
  }),
});

export const {
  useListVideosQuery,
  useListLearnersQuery,
  useListMyAssignmentsQuery,
  useMyProgressSummaryQuery,
  useSetVideoPublishedMutation,
} = api;
