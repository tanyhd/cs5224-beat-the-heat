"use client";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import styles from "./ChallengeTrackerPage.module.css";
import ChallengeTrackerForm from "@/features/challengeTracker/ChallengeTrackerForm";

const TRACKER_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Challenge Tracker", href: "/challengetracker" },
];

export default function ChallengeTrackerPage() {
  return (
    <div>
      <Breadcrumb links={TRACKER_BREADCRUMBS} />
      <Header
        headerText="Challenge Tracker"
        captionText="Redeem cool rewards from partner brands as you complete challenges and milestones. Unlock perks tied to Breeze Navigator mileage and your Chill Challenge Hub completions."
        containerClassName={styles.container}
      />
      <div style={{ padding: "20px" }}>
        <ChallengeTrackerForm />
      </div>
    </div>
  );
}
