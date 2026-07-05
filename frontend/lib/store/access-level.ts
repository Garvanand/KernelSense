import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccessLevel = "guest" | "power" | "kernel" | "research"

interface AccessLevelState {
  level: AccessLevel
  setLevel: (level: AccessLevel) => void
}

export const useAccessLevel = create<AccessLevelState>()(
  persist(
    (set) => ({
      level: "guest",
      setLevel: (level) => set({ level }),
    }),
    {
      name: "kernelsense-access-level",
    }
  )
)
