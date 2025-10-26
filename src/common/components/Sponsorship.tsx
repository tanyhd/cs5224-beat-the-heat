import { useEffect, useState } from "react";
import SponsorBox from "./SponsorBox";
import styles from "./Sponsorship.module.css";

export interface Sponsor {
    itemName: string
    tier: number
    sponsor: string
    type: 'gear' | 'apparel' | 'food'
    criteriaType: 'distance' | 'challenges'
    criteriaValue: number
    image: string
    status: 'locked' | 'available' | 'redemeed'
}

const Sponsorship = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    useEffect(() => {
        fetch("/api/sponsors")
            .then((response) => response.json())
            .then((data) => {
                setSponsors(data);
            });
    }, []);
    return (
        <div className={styles.sponsorshipContainer}>
            <div className={styles.filterBox}>Filter box</div>
            <div className={styles.sponsorList}>
                <div className={styles.sponsorGrip}>
                    {sponsors.length > 0 ? (
                        sponsors.map((sponsor) => (
                            <SponsorBox key={sponsor.itemName} sponsor={sponsor} />
                        ))
                    ) : (
                        <div>No sponsors found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sponsorship;