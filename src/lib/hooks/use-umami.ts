import { useCallback } from "react";
import { TUmamiTrackFunction } from "../../../app";

export const useUmamiEvent = () => {
  const umamiTrackFunction = useCallback<TUmamiTrackFunction>(
    (event, props) => {
      if (
        typeof window !== "undefined" &&
        window.umami &&
        window.umami.track &&
        typeof window.umami.track === "function"
      ) {
        window.umami.track(event, props);
      } else {
        console.log("Umami event (untracked):", event, props);
      }
    },
    []
  );
  return umamiTrackFunction;
};
