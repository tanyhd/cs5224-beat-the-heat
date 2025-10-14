import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Topnav from "@/common/components/Topnav";
import "./globals.css";
import PageContainer from "@/common/components/PageContainer";
import ChatWidget from "@/features/chatbot/ChatWidget";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: "[IT5007] Card Master App",
  description: "Helping you win the credit card game, one card at a time!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Topnav />
        <PageContainer>
          {children}
        </PageContainer>
        <ChatWidget/>
      </body>
    </html>
  );
}
