import Dropdown from "./Dropdown";
import cx from "classnames";
import styles from "./SponsorshipFilter.module.css";
import { Sponsor, Type, Status } from "./Sponsorship";
import { useState, useEffect } from "react";

interface SponsorshipFilterProps {
    sponsors: Sponsor[];
    setFilteredSponsors: (sponsors: Sponsor[]) => void;
}

interface SubPillsProps {
    label: string;
    value: string | number;
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
    const [statusFilterValue, setStatusFilterValue] = useState<string>("All");
    const [categoryFilterValue, setCategoryFilterValue] = useState<string>("All");
    const [sortValue, setSortValue] = useState<string>("Recommended");

    // --- Live stats from Challenge Tracker ---
    const [completedCount, setCompletedCount] = useState<number>(0);
    const [inProgressCount, setInProgressCount] = useState<number>(0);
    const [kmWalked, setKmWalked] = useState<number>(0);
    const [kmCycled, setKmCycled] = useState<number>(0);

    useEffect(() => {
      const fetchStats = async () => {
        const token = sessionStorage.getItem('userToken');
        if (!token) return;

        try {
          const res = await fetch('/api/challenge/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch stats');
          const data = await res.json();

          setCompletedCount(data.completedCount ?? 0);
          setInProgressCount(data.inProgressCount ?? 0);
          setKmWalked(data.kmWalked ?? 0);
          setKmCycled(data.kmCycled ?? 0);
        } catch (err) {
          console.error('Error fetching challenge stats:', err);
        }
      };
      fetchStats();
    }, []);

    const handleFilterChange = (filterType: string, filterValue: string) => {
        if (filterType === "Status") {
            if (filterValue === "All") setFilteredSponsors && setFilteredSponsors(sponsors);
            else {
                setFilteredSponsors && setFilteredSponsors(
                    sponsors.filter(s => s.status === filterValue.toLowerCase())
                );
            }
            setStatusFilterValue(filterValue);
        } else if (filterType === "Category") {
            if (filterValue === "All") setFilteredSponsors && setFilteredSponsors(sponsors);
            else {
                setFilteredSponsors && setFilteredSponsors(
                    sponsors.filter(s => s.type === filterValue.toLowerCase())
                );
            }
            setCategoryFilterValue(filterValue);
        }
    };

    const handleSortChange = (sortValue: string) => {
        let sortedSponsors = [...sponsors];
        if (sortValue === "A-Z") sortedSponsors.sort((a, b) => a.itemName.localeCompare(b.itemName));
        setFilteredSponsors && setFilteredSponsors(sortedSponsors);
        setSortValue(sortValue);
    };

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
        <div className={styles.header}>Your progress</div>
        <div className={styles.caption}>
            Earn rewards by completing challenges and clocking miles.
        </div>
        <div className={styles.pillsContainer}>
            <SubPills label="Challenges completed" value={completedCount} />
            <SubPills label="Challenges in progress" value={inProgressCount} />
            <SubPills label="Walking clocked" value={`${kmWalked} km`} />
            <SubPills label="Cycling clocked" value={`${kmCycled} km`} />
        </div>
      </div>
    </div>
  );
};

export default SponsorshipFilter;
