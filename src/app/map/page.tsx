import Breadcrumb from '@/common/components/Breadcrumb';
import Header from '@/common/components/Header';
import styles from './MapPage.module.css'

const MAP_BREADCRUMBS = [
   { name: "Home", href: "/" },
   { name: "Map Search", href: "/map" },
 ]

export default async function MapPage() {
//    const response = await fetch('http://localhost:3000/api/map', { cache: 'no-store' });
//    const data = await response.json();
   return (
      <div>
         <Breadcrumb links={MAP_BREADCRUMBS}/>
         <Header 
            headerText='Map Search' 
            captionText='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' 
            containerClassName={styles.container}
         />
      </div>
   );
}