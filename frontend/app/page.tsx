"use client";

import React, { useEffect, useState } from "react";
import OSUniverseCanvas from "@/components/universe/os-canvas";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white">
      <OSUniverseCanvas />
    </div>
  );
}

