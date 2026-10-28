import { useEffect, useState } from "react";
import { useScreenInit } from "../useScreenInit";

/*
  Stand-in for TanStack Query's useQuery in the prototype.
  Same contract the screens will consume later: { isLoading, isError, refetch }.
  A key loads once per session, like the React Query cache.
  ?figr_screen states can force "loading" or "error".
*/
const loaded = new Set<string>();
export type QueryStatus = "loading" | "error" | "success";

export function useMockQuery(key: string, delay = 700) {
  const init = useScreenInit();
  const forced = init.dataState;
  const [status, setStatus] = useState<QueryStatus>(() =>
    forced === "error" ? "error" : forced === "loading" ? "loading" : loaded.has(key) ? "success" : "loading",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (status !== "loading" || forced === "loading") return;
    const t = setTimeout(() => {
      loaded.add(key);
      setStatus("success");
    }, delay);
    return () => clearTimeout(t);
  }, [status, attempt, forced, key, delay]);

  return {
    status,
    isLoading: status === "loading",
    isError: status === "error",
    refetch: () => {
      setStatus("loading");
      setAttempt((a) => a + 1);
    },
  };
}

