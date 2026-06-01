import { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext({
  dark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("darkMode", String(dark));
    } catch {
      // localStorage not available
    }
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDarkMode() {
  return useContext(DarkModeContext);
}