import { useCallback, useState } from "react";

export type Screen =
  | "home"
  | "album"
  | "artist"
  | "search"
  | "lists"
  | "profile"
  | "edit-profile"
  | "settings"
  | "login"
  | "register";

interface UseNavigationOptions {
  initialScreen?: Screen;
}

export function useNavigation({ initialScreen = "home" }: UseNavigationOptions = {}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [navHistory, setNavHistory] = useState<string[]>([]);

  const pushScreen = useCallback((next: Screen, from?: string) => {
    const fromScreen = from ?? screen;
    if (fromScreen && fromScreen !== next) {
      setNavHistory((prev) => (prev.includes(fromScreen) ? prev : [...prev, fromScreen]));
    }
    setScreen(next);
  }, [screen]);

  const goBack = useCallback(() => {
    const last = navHistory[navHistory.length - 1];
    setNavHistory((prev) => prev.slice(0, -1));
    switch (last) {
      case "search":
        setScreen("search");
        break;
      case "home":
        setScreen("home");
        break;
      case "lists":
        setScreen("lists");
        break;
      case "artist":
        setScreen("artist");
        break;
      default:
        setScreen("home");
        break;
    }
  }, [navHistory]);

  const clearHistory = useCallback(() => setNavHistory([]), []);

  return { screen, setScreen, pushScreen, goBack, navHistory, clearHistory };
}
