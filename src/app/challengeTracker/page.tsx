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
        captionText="Track your daily walks and cycles, record every kilometer, and see your progress grow. Complete challenges, hit milestones, and celebrate your achievements along the way. Your journey, your victories. Every step counts!"
        containerClassName={styles.container}
      />
      <div style={{ padding: "20px" }}>
        <ChallengeTrackerForm />
      </div>
    </div>
  );
}
