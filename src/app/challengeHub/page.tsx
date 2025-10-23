"use client";
import { useEffect, useState } from "react";

import Breadcrumb from "@/common/components/Breadcrumb";
import Challenges from "../../features/challengeHub/component/ChallengeHub";
import Header from "@/common/components/Header";
import styles from "./ChallengePage.module.css";

const CHALLENGES_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Chill Challenge Hub", href: "/challengeHub" },
];

export default function ChallengePage() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/challengeHub")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return (
    <div>
      <Breadcrumb links={CHALLENGES_BREADCRUMBS} />
      <Header
        headerText="Chill Challenge Hub"
        captionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        containerClassName={styles.container}
      />
      <Challenges challenges={data} />
    </div>
  );
}
