import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  LearnerAssignment,
  LearnerProgressSummary,
  Paginated,
  Question,
  User,
  Video,
} from '../types';
import type { ListMyAssignmentsParams } from '../api/assignments';
import type { ListVideosParams } from '../api/videos';
import type { ListLearnersParams } from '../api/users';
import { clearSession } from '../auth/authStorage';
import {
  isAuthPublicUrl,
  redirectToLogin,
  refreshAccessToken,
} from '../auth/tokenRefresh';
import {
  infiniteForceRefetch,
  infiniteMerge,
  infiniteSerializeArgs,
} from '../hooks/infiniteQuery';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/$/,
  '',
);

export type ListVideoQuestionsParams = {
  videoId: string;
  page?: number;
  limit?: number;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
});

function requestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

/**
 * On 401, share one refresh (see tokenRefresh) then retry once.
 * Concurrent RTK failures all await the same promise — no refresh stampede.
 * Access/refresh tokens are HttpOnly cookies (sent via credentials: 'include').
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isAuthPublicUrl(requestUrl(args))) {
    return result;
  }

  try {
    await refreshAccessToken();
    result = await rawBaseQuery(args, api, extraOptions);
  } catch {
    clearSession();
    redirectToLogin();
  }

  return result;
};

/**
 * Server-state cache (RTK Query).
 * Learner assignment lists merge pages (infinite scroll).
 * Admin video/learner lists keep one page per cache key (button pagination).
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'VideoList',
    'LearnerList',
    'MyAssignmentList',
    'MyProgressSummary',
    'VideoQuestions',
  ],
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

    listVideoQuestions: builder.query<Paginated<Question>, ListVideoQuestionsParams>({
      query: ({ videoId, page, limit }) => ({
        url: `/videos/${videoId}/questions`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'VideoQuestions', id: arg.videoId },
      ],
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
  useListVideoQuestionsQuery,
  useListMyAssignmentsQuery,
  useMyProgressSummaryQuery,
  useSetVideoPublishedMutation,
} = api;
