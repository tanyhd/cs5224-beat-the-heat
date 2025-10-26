import Image from "next/image";
import { Sponsor } from "./Sponsorship";
import styles from "./SponsorBox.module.css";
import Map from "../icons/Map";
import Trophy from "../icons/Trophy";
import Handshake from "../icons/Handshake";
import Button from "./Button";

interface SponsorBoxProps {
    sponsor: Sponsor;
}

const CriteriaIcon = ({criteriaType, criteriaValue}: {criteriaType: 'distance' | 'challenges', criteriaValue: number}) => {
    if (criteriaType === 'distance') {
        return [<Map key='distance-icon' />, `Clock ${criteriaValue/1000}km`];
    } else if (criteriaType === 'challenges') {
        return [<Trophy key='challenges-icon' />, `Complete ${criteriaValue} challenges`];
    } else {
        return null;
    }
}

const SponsorBox = ({sponsor}: SponsorBoxProps) => {
    const { image, sponsor: sponsorName, itemName, type, tier, criteriaType, criteriaValue } = sponsor;
    return (
        <div className={styles.sponsorBox}>
            <Image className={styles.sponsorImage} src={image} alt={sponsorName} width={100} height={100} />
            <div className={styles.sponsorInfoContainer}>
                <div className={styles.sponsorHeaderInfo}>
                    <h3 className={styles.sponsorHeader}>{itemName}</h3>
                    <div className={styles.sponsorHeaderTags}>
                        <p className={styles.sponsorHeaderTag}>{type}</p>
                        {/* <p className={styles.sponsorHeaderTag}>Tier {tier}</p> */}
                    </div>
                </div>
                <div className={styles.sponsorDescription}>
                    <CriteriaIcon criteriaType={criteriaType} criteriaValue={criteriaValue}/>
                </div>
                <div className={styles.sponsorFooter}>
                    <div className={styles.sponsorName}><Handshake /> <p className={styles.sponsorName}>{sponsorName}</p></div>
                    <Button classNameProps={styles.redeemButton}>Redeem</Button>
                </div>
            </div>
        </div>
    );
};

export default SponsorBox;