import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { renderHook, type RenderHookResult } from "@testing-library/react";
import { makeStore, type AppStore } from "./index";

type HookWrapper = {
  store: AppStore;
  wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;
};

export function createHookWrapper(): HookWrapper {
  const store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

export function renderHookWithStore<Result, Props>(
  hook: (props: Props) => Result,
  options?: { initialProps?: Props }
): RenderHookResult<Result, Props> & { store: AppStore } {
  const { store, wrapper } = createHookWrapper();
  return { ...renderHook(hook, { wrapper, ...options }), store };
}
