import { createContext } from "react";

// Share deterministic initial public state between HTML generation and hydration.
export const PublicRenderContext = createContext(null);
