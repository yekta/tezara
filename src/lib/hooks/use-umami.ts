import { useCallback } from "react";

type TUmamiTrackFunction = (
  event: string,
  props?: Record<string, string | number>
) => void;

type TUmamiOriginal = {
  track: TUmamiTrackFunction;
};

type TWindow = {
  umami?: TUmamiOriginal;
};

export type TUmami = {
  capture: TUmamiTrackFunction;
};

export const useUmami: () => { capture: TUmamiTrackFunction } = () => {
  const umamiTrackFunction = useCallback<TUmamiTrackFunction>(
    (event, props) => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as TWindow) &&
        (window as unknown as TWindow).umami?.track &&
        typeof (window as unknown as TWindow).umami?.track === "function"
      ) {
        (window as unknown as TWindow).umami?.track(event, props);
      } else {
        console.log("Umami event (untracked):", event, props);
      }
    },
    []
  );
  return { capture: umamiTrackFunction };
};
