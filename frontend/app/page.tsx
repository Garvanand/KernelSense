"use client";

import React, { useState } from "react";
import { BootSequence } from "@/components/boot/boot-sequence";
import { SpatialShell } from "@/components/shell/spatial-shell";
import { ParticleField } from "@/components/atmosphere/particle-field";

// The views
import { SystemOrganism } from "@/components/organism/system-organism";
import { MemoryTerrain } from "@/components/organism/memory-terrain";
import { CpuTopology } from "@/components/organism/cpu-topology";
import { IncidentTheater } from "@/components/incidents/incident-theater";

export default function RootPage() {
  const [bootComplete, setBootComplete] = useState(false);

  return (
    <>
      {/* Global atmosphere elements */}
      {bootComplete && <ParticleField />}
      
      {!bootComplete ? (
        <BootSequence onComplete={() => setBootComplete(true)} />
      ) : (
        <SpatialShell>
          {(activeView) => {
            switch (activeView) {
              case "organism":
                return <SystemOrganism />;
              case "memory":
                return <MemoryTerrain />;
              case "scheduler":
                return <CpuTopology />;
              case "incidents":
                return <IncidentTheater />;
              default:
                return null;
            }
          }}
        </SpatialShell>
      )}
    </>
  );
}
