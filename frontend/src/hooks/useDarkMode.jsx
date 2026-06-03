import { createContext, useContext } from "react";

const DarkModeContext = createContext({
  dark: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }) {
  return (
    <DarkModeContext.Provider value={{ dark: false, toggle: () => {} }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}