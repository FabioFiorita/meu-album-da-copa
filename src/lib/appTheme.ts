export type AppTheme = "dark" | "light";

const APP_THEME_KEY = "copa_album_theme";

export function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(APP_THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyAppTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.appTheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function saveAppTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_THEME_KEY, theme);
}
