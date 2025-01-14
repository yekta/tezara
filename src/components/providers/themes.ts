export const availableThemes = ["light", "dark", "system"] as const;
export const themes = [...availableThemes];
export type TTheme = (typeof availableThemes)[number];
export const defaultTheme: TTheme = "light";
