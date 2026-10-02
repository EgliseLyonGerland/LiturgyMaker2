import { createContext, useContext } from "react";

interface LiturgyBlockContext {
  remove: () => void;
}

const liturgyBlockContext = createContext<LiturgyBlockContext | null>(null);

function useLiturgyBlockContext() {
  const context = useContext(liturgyBlockContext);

  if (!context) {
    throw new Error("useLiturgyBlockContext() must be used within a LiturgyBlockContext.Provider");
  }

  return context;
}

export { liturgyBlockContext, useLiturgyBlockContext };
