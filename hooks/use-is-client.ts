"use client";

import { useState, useEffect } from "react";

/**
 * A hook to determine if the code is running on the client side
 * Used to avoid hydration errors with code that uses browser-only APIs
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
