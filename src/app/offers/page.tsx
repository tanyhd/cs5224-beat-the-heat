import Breadcrumb from '@/common/components/Breadcrumb';
import Offers from '../../features/offers/component/Offers';
import Header from '@/common/components/Header';
import styles from './OffersPage.module.css'

const OFFERS_BREADCRUMBS = [
   { name: "Home", href: "/" },
   { name: "Credit Card Offers", href: "/offers" },
 ]

export default async function OffersPage() {
   const response = await fetch('http://localhost:3000/api/offers', { cache: 'no-store' });
   const data = await response.json();
   return (
      <div>
         <Breadcrumb links={OFFERS_BREADCRUMBS}/>
         <Header 
            headerText='Credit Card Offers' 
            captionText='Discover exclusive credit card offers with great rewards and benefits' 
            containerClassName={styles.container}
         />
         <Offers offers={data}/>
      </div>
   );
}