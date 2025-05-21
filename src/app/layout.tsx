import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eaxy Data | Sistema de Gestión para Talleres",
  description: "Eaxy Data: Plataforma integral para la gestión de talleres. Controla valoraciones, facturación, KPIs y mucho más desde un solo lugar.",
  keywords: "Eaxy Data, software taller, gestión de talleres, CST, valoraciones siniestros, facturación taller, KPIs taller, sistema gestión mecánica",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <Script id="microsoft-clarity">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "ribwjy4dr1");
        `}
      </Script>
      <body suppressHydrationWarning className={`${inter.className} h-full overflow-auto`}>
        <Toaster position="top-right" />
        <main className="h-full">
          {children}
        </main>
      </body>
    </html>
  );
} 