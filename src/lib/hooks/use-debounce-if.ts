import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export default function useDebounceIf(
  initialValue: string,
  ifFunction: (v: string) => boolean,
  delay = 150
) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValueRightAway] = useState(initialValue);

  const setValueDebounced = useDebounceCallback(
    setDebouncedValueRightAway,
    delay
  );

  useEffect(() => {
    if (ifFunction(value)) {
      setValueDebounced(value);
      return;
    }
    setDebouncedValueRightAway(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return [value, setValue, debouncedValue] as const;
}
