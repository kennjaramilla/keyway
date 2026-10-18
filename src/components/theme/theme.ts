import { WORKSPACE_STORAGE_KEY, type ThemePreference } from "@/stores/workspace-store";

export function resolveTheme(preference: ThemePreference, prefersDark: boolean) {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

/** Inline, pre-paint: apply the saved theme to <html data-theme>. Kept tiny and dependency-free. */
export const themeScript = `(function(){try{var p=(JSON.parse(localStorage.getItem(${JSON.stringify(
  WORKSPACE_STORAGE_KEY,
)})||"{}").state||{}).theme||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
