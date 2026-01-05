import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Topnav from "@/common/components/Topnav";
import "./globals.css";
import PageContainer from "@/common/components/PageContainer";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: "Beat The Heat",
  description: "Find cooler routes, join chill challenges, and track your HeatBeat to move smarter on hot days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0B1MS5YK89"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0B1MS5YK89');
          `}
        </Script>

        <Topnav />
        <PageContainer>
          {children}
        </PageContainer>
      </body>
    </html>
  );
}
