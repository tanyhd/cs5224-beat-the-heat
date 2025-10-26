"use client";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import styles from "./SponsorshipPage.module.css";
import Sponsorship from "@/common/components/Sponsorship";

const SPONSORSHIP_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Sponsorship", href: "/sponsorship" },
];

export default function SponsorshipPage() {
  return (
    <div>
      <Breadcrumb links={SPONSORSHIP_BREADCRUMBS} />
      <Header
        headerText="Sponsor Collaborations"
        captionText="Redeem cool rewards from partner brands as you complete challenges and milestones. Unlock perks tied to Breeze Navigator mileage and your Chill Challenge Hub completions."
        containerClassName={styles.container}
      />
      <div style={{ padding: "20px" }}>
        <Sponsorship />
      </div>
    </div>
  );
}
