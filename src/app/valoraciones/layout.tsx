"use client";

import Sidebar from "@/components/Dashboard/Sidebar";

export default function ValoracionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
} 