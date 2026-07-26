"use client";

import { createContext, useContext, useState } from "react";

const FullScreenContext = createContext<{
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
} | null>(null);

export function FullScreenProvider({ children }: { children: React.ReactNode }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  return (
    <FullScreenContext.Provider value={{ isFullScreen, setIsFullScreen }}>
      {children}
    </FullScreenContext.Provider>
  );
}

export function useFullScreen() {
  const context = useContext(FullScreenContext);
  if (!context) {
    throw new Error("useFullScreen must be used within a FullScreenProvider");
  }
  return context;
}
