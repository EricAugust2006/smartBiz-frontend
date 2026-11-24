import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../src/index.css";
import { B2B_SESSION_KEY, useAuthStore } from "../src/store/useAuthStore";
import { THEME_STORAGE_KEY, useThemeStore } from "../src/store/useThemeStore";
import { AppProviders } from "../src/components/providers/app-providers";
import { ThemeProvider } from "../src/components/theme/theme-provider";
import { themeInitializationScript } from "../src/components/theme/theme-initialization-script";

export default function NextApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
    useThemeStore.getState().hydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === B2B_SESSION_KEY || event.key === null)
        useAuthStore
          .getState()
          .syncSession(event.key === null ? null : event.newValue);
      if (event.key === THEME_STORAGE_KEY || event.key === null)
        useThemeStore.getState().sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </Head>
      <ThemeProvider>
        <AppProviders>
          <Component {...pageProps} />
        </AppProviders>
      </ThemeProvider>
    </>
  );
}
