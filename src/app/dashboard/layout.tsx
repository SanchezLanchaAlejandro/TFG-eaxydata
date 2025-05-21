"use client";

import React from 'react';
import Sidebar from "@/components/Dashboard/Sidebar";

// Utilizamos React.memo para evitar re-renders innecesarios del layout
export default React.memo(function DashboardContainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
}); 