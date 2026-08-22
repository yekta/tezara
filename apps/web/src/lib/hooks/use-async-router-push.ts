// Taken from https://github.com/vercel/next.js/issues/61737#issuecomment-2248830960

"use client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

// Define the type for the observer callback function
type ObserverCallback = () => void;

const createRouteObserver = () => {
  let observer: ObserverCallback | null = null;

  const setObserver = (callback: ObserverCallback) => {
    observer = callback;
  };

  const notify = () => {
    if (observer) {
      observer();
    }
  };

  return { setObserver, notify };
};

const routeObserver = createRouteObserver();

export const useAsyncRouterPush = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const asyncPush = async (path: string) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        router.push(path);
      });

      routeObserver.setObserver(() => {
        resolve();
      });
    });
  };

  useEffect(() => {
    if (!isPending) {
      routeObserver.notify();
    }
  }, [isPending]);

  return [asyncPush, isPending] as const;
};
