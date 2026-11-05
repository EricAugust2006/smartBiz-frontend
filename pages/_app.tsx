import { useEffect } from "react";
import type { AppProps } from "next/app";
import "../src/index.css";
import { B2B_SESSION_KEY, useAuthStore } from "../src/store/useAuthStore";

export default function NextApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === B2B_SESSION_KEY || event.key === null)
      )
        useAuthStore
          .getState()
          .syncSession(event.key === null ? null : event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <Component {...pageProps} />;
}
