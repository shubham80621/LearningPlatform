import type { AppDispatch } from './index';
import { api } from './api';

/** Call after create/edit video so the next list visit (or dashboard silent refresh) is fresh. */
export function invalidateVideoLists(dispatch: AppDispatch) {
  dispatch(api.util.invalidateTags([{ type: 'VideoList', id: 'LIST' }]));
}

/** Call after create/update learner. */
export function invalidateLearnerLists(dispatch: AppDispatch) {
  dispatch(api.util.invalidateTags([{ type: 'LearnerList', id: 'LIST' }]));
}

/** Call after watch progress / quiz answers so learner home soft-refreshes. */
export function invalidateMyAssignments(dispatch: AppDispatch) {
  dispatch(
    api.util.invalidateTags([
      { type: 'MyAssignmentList', id: 'LIST' },
      { type: 'MyProgressSummary', id: 'SUMMARY' },
    ]),
  );
}
