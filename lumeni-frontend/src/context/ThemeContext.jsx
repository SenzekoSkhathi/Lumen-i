import React, { createContext, useContext, useMemo } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const ThemeModeContext = createContext({ mode: "dark", toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}


export function ThemeModeProvider({ children }) {
  // Hard code the mode to dark; the toggle function is a no‑op
  const mode = "dark";

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
          background: {
            // Onyx dark backgrounds.  Default covers the page and paper covers
            // panels such as cards and drawers.
            default: "#2A2A2A",
            paper: "#1A1A1A",
          },
          primary: {
            // Aqua accent used for buttons, chips and highlights
            main: "#1A1A1A",
          },
          secondary: {
            // Soft blue secondary accent for secondary actions
            main: "#2A2A2A",
          },
          text: {
            // Light text colours appropriate for dark backgrounds
            primary: "#F5F5F7",
            secondary: "#B0B0B8",
          },
        },
        shape: {
          borderRadius: 16,
        },
      }),
    []
  );

  const toggleMode = () => {
  };

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
