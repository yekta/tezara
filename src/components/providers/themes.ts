export const availableThemes = ["light", "dark", "system"] as const;
export const themes = [...availableThemes];
export type TTheme = (typeof availableThemes)[number];
export type TThemeWithoutSystem = Exclude<TTheme, "system">;
export const defaultTheme: TThemeWithoutSystem = "light";

export const metaTheme: Record<TThemeWithoutSystem, string> = {
  dark: "#09080d",
  light: "#ffffff",
};
