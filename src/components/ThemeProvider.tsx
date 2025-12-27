import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="ai-medical-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
};
