export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sop-automator-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function applyThemeToDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** DOM + localStorage (user-initiated or post-hydration updates). */
export function applyTheme(theme: Theme) {
  applyThemeToDocument(theme);
  persistTheme(theme);
}

export function readThemeScript() {
  return `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k);document.documentElement.setAttribute("data-theme",t==="light"||t==="dark"?t:"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
}
