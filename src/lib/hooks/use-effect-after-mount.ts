import { useEffect, useRef } from "react";

export const useEffectAfterMount: typeof useEffect = (effect, deps) => {
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) {
      return effect();
    } else {
      hasMounted.current = true;
    }
  }, deps);
};
