"use client";

import Sidebar from "@/components/Dashboard/Sidebar";

export default function FacturacionLayout({
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