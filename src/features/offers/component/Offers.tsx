import Button from '@/common/components/Button';
import SubDetails from '@/common/components/SubDetails';
import Clock from '@/common/icons/Clock';
import DollarSign from '@/common/icons/DollarSign';
import Info from '@/common/icons/Info';
import ShoppingCart from '@/common/icons/ShoppingCart';
import styles from './Offers.module.css'
import TableRow from '@/common/components/TableRow';
import AvatarPlus from '@/common/icons/AvatarPlus';
import Avatar from '@/common/icons/Avatar';

interface OfferSection {
    headingId: string;
    title: string;
    offerEnds: string;
    imageUrl: string;
    cardLink: string;
    applyUrl: string;
    detailsUrl: string;
    column1Title: string;
    column2Title: string;
    column1: {
        annualFee: string;
        annualFeeText: string;
        spend: string;
        spendPeriod: string;
        baseMiles: string;
        bonusMiles: string;
        totalMiles: string;
    };
    column2: {
        annualFee: string;
        annualFeeText: string;
        spend: string;
        spendPeriod: string;
        baseMiles: string;
        bonusMiles: string;
        totalMiles: string;
    };
}

export default function Offers({offers}: { offers: OfferSection[] }) {
    return (
        <div>
            {offers.map((offer, index) => (
                <div key={index} >
                    <h3 className={styles.title}>{offer.title}</h3>
                    <img src={offer.imageUrl} alt={offer.title} style={{ maxWidth: '200px' }} />
                    <div className={styles.subDetailsContainer}>
                        <SubDetails details={{
                            label: 'Offer Details',
                            subLabel: `Promotion ending ${new Date(offer.offerEnds).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`,
                            icon: <Info stroke="#FF5B27" />
                        }} />
                        <SubDetails details={{
                            label: 'Annual Fee',
                            subLabel: `$${(Number(offer.column1.annualFee)).toFixed(2)} ${offer.column1.annualFeeText}`,
                            icon: <DollarSign stroke='#FF5B27' />
                        }} />
                        <SubDetails details={{
                            label: 'Spend Requirement',
                            subLabel: `$${(Number(offer.column1.spend)).toFixed(2)}`,
                            icon: <ShoppingCart stroke='#FF5B27' />
                        }} />
                        <SubDetails details={{
                            label: 'Spend Period',
                            subLabel: offer.column1.spendPeriod,
                            icon: <Clock stroke='#FF5B27' />
                        }} />
                    </div>
                    <h3 className={styles.subHeader}>Rewards Structure</h3>

                    <table className={styles.table}>
                        <thead className={styles.tableHeader}>
                            <TableRow>
                                <th style={{ textAlign: 'left' }}>Customer Type</th>
                                <th style={{ textAlign: 'right' }}>Base Miles</th>
                                <th style={{ textAlign: 'right' }}>Bonus Miles</th>
                                <th style={{ textAlign: 'right' }}>Total Miles</th>
                            </TableRow>
                        </thead>
                        <tbody>
                            <TableRow>
                                <td><AvatarPlus className={styles.tableIcon} />{offer.column1Title} Customers</td>
                                <td style={{ textAlign: 'right' }}>{offer.column1.baseMiles}</td>
                                <td style={{ textAlign: 'right' }}>{offer.column1.bonusMiles}</td>
                                <td style={{ textAlign: 'right' }}>{offer.column1.totalMiles}</td>
                            </TableRow>
                            {offer.column2Title && (
                                <TableRow>
                                    <td><Avatar className={styles.tableIcon} />{offer.column2Title} Customers</td>
                                    <td style={{ textAlign: 'right' }}>{offer.column2.baseMiles}</td>
                                    <td style={{ textAlign: 'right' }}>{offer.column2.bonusMiles}</td>
                                    <td style={{ textAlign: 'right' }}>{offer.column2.totalMiles}</td>
                                </TableRow>
                            )}
                        </tbody>
                    </table>

                    <Button href={offer.applyUrl} target='_blank' classNameProps={styles.button}>Apply Card</Button>

                </div>
            ))}
        </div>
    );
}