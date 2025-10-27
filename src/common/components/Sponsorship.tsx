import { useEffect, useState } from "react";
import SponsorBox from "./SponsorBox";
import SponsorshipFilter from "./SponsorshipFilter";
import styles from "./Sponsorship.module.css";

export type Type = 'gear' | 'apparel' | 'food';
export type CriteriaType = 'distance' | 'challenges';
export type Status = 'locked' | 'available' | 'redeemed';

export interface Sponsor {
    itemName: string
    tier: number
    sponsor: string
    type: Type
    criteriaType: CriteriaType
    criteriaValue: number
    image: string
    status: Status
}

const Sponsorship = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);
    useEffect(() => {
        fetch("/api/sponsors")
            .then((response) => response.json())
            .then((data) => {
                setSponsors(data);
                setFilteredSponsors(data);
            });
    }, []);
    return (
        <div className={styles.sponsorshipContainer}>
            <div className={styles.filterBox}><SponsorshipFilter sponsors={sponsors} setFilteredSponsors={setFilteredSponsors} /></div>
            <div className={styles.sponsorList}>
                <div className={styles.sponsorGrip}>
                    {filteredSponsors.length > 0 ? (
                        filteredSponsors.map((sponsor) => (
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