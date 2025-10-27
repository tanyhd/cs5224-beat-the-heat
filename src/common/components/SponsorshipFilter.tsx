import Dropdown from "./Dropdown";
import cx from "classnames";
import styles from "./SponsorshipFilter.module.css";
import { Sponsor, Type, Status } from "./Sponsorship";
import { useState } from "react";

interface SponsorshipFilterProps {
    sponsors: Sponsor[];
    setFilteredSponsors: (sponsors: Sponsor[]) => void;
}

interface SubPillsProps {
    label: string;
    value: string;
}

const TYPES: Type[] = ['gear', 'apparel', 'food'];
const STATUSES: Status[] = ['locked', 'available', 'redeemed'];


const SubPills = ({ label, value }: SubPillsProps) => {
  return (
    <div className={styles.pill}>
      <span>{label}</span>
      <span className={styles.header}>{value}</span>
    </div>
  );
};

const SponsorshipFilter = ({ sponsors, setFilteredSponsors }: SponsorshipFilterProps) => {
    const [statusFilterValue, setStatusFilterValue] =  useState<string>("All");
    const [categoryFilterValue, setCategoryFilterValue] =  useState<string>("All");
    const [sortValue, setSortValue] =  useState<string>("Recommended");
    const handleFilterChange = (filterType: string, filterValue: string) => {
        if (filterType === "Status") {
            if (filterValue === "All") {
                setFilteredSponsors && setFilteredSponsors(sponsors);
            } else {
                const filteredSponsors = sponsors.filter(
                    (sponsor) => sponsor.status === filterValue.toLowerCase()
                );
                setFilteredSponsors && setFilteredSponsors(filteredSponsors);
            }
            setStatusFilterValue(filterValue);
        } else if (filterType === "Category") {
            if (filterValue === "All") {
                setFilteredSponsors && setFilteredSponsors(sponsors);
            } else {
                const filteredSponsors = sponsors.filter(
                    (sponsor) => sponsor.type === filterValue.toLowerCase()
                );
                setFilteredSponsors && setFilteredSponsors(filteredSponsors);
            }
            setCategoryFilterValue(filterValue);
        }
    }

    const handleSortChange = (sortValue: string) => {
        let sortedSponsors = [...sponsors];
        if (sortValue === "A-Z") {
            sortedSponsors.sort((a, b) => a.itemName.localeCompare(b.itemName));
        } 
        setFilteredSponsors && setFilteredSponsors(sponsors);
        setSortValue(sortValue);
    }

  return (
    <div className={styles.sponsorshipFilterContainer}>
      <div className={styles.header}>Filters</div>
      <Dropdown
        name="Status"
        label="Status"
        options={["All", ...STATUSES]}
        value={statusFilterValue}
        onChange={(e) => handleFilterChange("Status", e.target.value)}
        className={styles.container}
      />
      <Dropdown
        name="Category"
        label="Category"
        options={["All", ...TYPES]}
        value={categoryFilterValue}
        onChange={(e) => handleFilterChange("Category", e.target.value)}
        className={styles.container}
      />
      <Dropdown
        name="Sort"
        label="Sort"
        options={["Recommended", "A-Z"]}
        value={sortValue}
        onChange={(e) => handleSortChange(e.target.value)}
        className={styles.container}
      />

      <div className={cx(styles.container, styles.progressBox)}>
        <div className={styles.header}>
            Your progress
        </div>
        <div className={styles.caption}>
            Earn rewards by completing challenges and clocking miles.
        </div>
        <div className={styles.pillsContainer}>
            <SubPills label="Challenges completed" value="12" />
            <SubPills label="Challenges in progress" value="3" />
            <SubPills label="Walking clocked" value="5km" />
            <SubPills label="Cycling clocked" value="50km" />
        </div>
      </div>
    </div>
  );
};

export default SponsorshipFilter;
