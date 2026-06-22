/**
 * Shared async-fetch fields for Redux slices that cache API data.
 * Hooks own polling/fingerprint logic; slices own UI-facing server cache.
 */
export type AsyncFetchFields = {
  isLoading: boolean;
  error: string | null;
  apiUnreachable: boolean;
};

export const initialAsyncFetch: AsyncFetchFields = {
  isLoading: false,
  error: null,
  apiUnreachable: false,
};

export function applyFetchSuccess(state: AsyncFetchFields) {
  state.error = null;
  state.apiUnreachable = false;
  state.isLoading = false;
}

export function applyFetchError(
  state: AsyncFetchFields,
  error: string,
  apiUnreachable = false
) {
  state.error = error;
  state.apiUnreachable = apiUnreachable;
  state.isLoading = false;
}
