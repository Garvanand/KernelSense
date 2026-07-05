import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccessLevel = "guest" | "power" | "kernel" | "research"

interface AccessLevelState {
  level: AccessLevel
  hasSeenOnboarding: boolean
  demoMode: boolean
  setLevel: (level: AccessLevel) => void
  setHasSeenOnboarding: (val: boolean) => void
  setDemoMode: (val: boolean) => void
}

export const useAccessLevel = create<AccessLevelState>()(
  persist(
    (set) => ({
      level: "guest",
      hasSeenOnboarding: false,
      demoMode: false,
      setLevel: (level) => set({ level }),
      setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: val }),
      setDemoMode: (val) => set({ demoMode: val }),
    }),
    {
      name: "kernelsense-access-level",
    }
  )
)
