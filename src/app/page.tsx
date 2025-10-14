'use client';

import styles from "./page.module.css";
import Header from "../common/components/Header";
import { LandingNavigation } from "@/common/components/LandingNavigation";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export default function Home() {


  return (
    <>
      <main className={styles.main}>
        <div style={{ width: '150px', height: '150px', margin: '0 auto 24px' }}>
          <DotLottieReact
            src="/homepage-animation.lottie"
            loop
            autoplay
          />
        </div>
        <Header captionTextClassName={styles.captionText} headerText="Welcome to CardMaster" captionText="Manage your credit cards with ease"/>
        <LandingNavigation />
      </main>
    </>
  );
}
