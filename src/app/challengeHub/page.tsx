import Breadcrumb from '@/common/components/Breadcrumb';
import Challenges from '../../features/challengeHub/component/ChallengeHub';
import Header from '@/common/components/Header';
import styles from './ChallengePage.module.css'

const CHALLENGES_BREADCRUMBS = [
   { name: "Home", href: "/" },
   { name: "Chill Challenge Hub", href: "/challengeHub" },
 ]

export default async function ChallengePage() {
   const response = await fetch('http://localhost:3000/api/challengeHub', { cache: 'no-store' });
   const data = await response.json();
   return (
      <div>
         <Breadcrumb links={CHALLENGES_BREADCRUMBS}/>
         <Header 
            headerText='Chill Challenge Hub' 
            captionText='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' 
            containerClassName={styles.container}
         />
         <Challenges challenges={data}/>
      </div>
   );
}