import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Paginated, User, Video } from '../types';
import type { ListVideosParams } from '../api/videos';
import type { ListLearnersParams } from '../api/users';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

/**
 * Server-state cache (RTK Query).
 * - Same-arg in-flight requests are deduped (no StrictMode double network call).
 * - keepUnusedDataFor keeps list pages warm after navigate-away.
 * - refetchOnMountOrArgChange: false → returning to a cached page shows data instantly.
 *   Dashboard overrides this for a silent background refresh.
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
  tagTypes: ['VideoList', 'LearnerList'],
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
      providesTags: [{ type: 'LearnerList', id: 'LIST' }],
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
  useSetVideoPublishedMutation,
} = api;
