"use client";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import { Map } from "@/common/components/Map";
import styles from "./MapPage.module.css";

const MAP_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Map Search", href: "/map" },
];

export default function MapPage() {
  return (
    <div>
      <Breadcrumb links={MAP_BREADCRUMBS} />
      <Header
        headerText="Breeze Navigator"
        captionText="Find sheltered routes through Singapore with covered walkways, linkways, and pedestrian bridges. Plan your journey to beat the heat!"
        containerClassName={styles.container}
      />
      <div style={{ padding: "20px" }}>
        <Map />
      </div>
    </div>
  );
}
