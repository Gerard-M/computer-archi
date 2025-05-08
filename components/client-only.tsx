"use client"

import { useEffect, useState, ReactNode } from "react"

interface ClientOnlyProps {
  children: ReactNode
}

/**
 * Component that only renders its children on the client side
 * Used to prevent hydration mismatches for components that use browser-specific APIs
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <>{children}</>
}
