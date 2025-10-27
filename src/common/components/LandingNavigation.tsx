import Grid from "../icons/Grid"
import styles from "./LandingNavigation.module.css"
import {LinkDetailBox} from "./DetailBox"
import Trophy from "../icons/Trophy"
import Beat from "../icons/Beat"
import Handshake from "../icons/Handshake"

const HOMEPAGE_NAV_LINKS = [
   {
     label: 'Breeze Navigator',
     subLabel: 'Discover optimal routes with shade and lower temperatures for your walks or cycles',
     linkText: 'Navigate Now',
     link: '/map',
     icon: <Grid stroke={"#06B6D4"}/>
   },
   {
     label: 'Chill Challenge Hub',
     subLabel: 'Join walking or cycling challenges to stay active and cool',
     linkText: 'View Challenges',
     link: '/challengeHub',
     icon: <Trophy stroke={"#06B6D4"}/>
   },
   {
      label: 'Challenge Tracker',
      subLabel: 'Log your activity progress and monitor your performance in the heat',
      linkText: 'Track challenge',
      link: '/challengeTracker',
      icon: <Beat stroke={"#06B6D4"}/>
    },
    {
      label: 'Sponsor Collaborations',
      subLabel: "Explore curated items from sponsors: cooling gear, hydration, and shade solutions",
      linkText: 'Browse Sponsors',
      link: '/sponsorship',
      icon: <Handshake stroke={"#06B6D4"}/>
    },
 ]

export function LandingNavigation () {
   return (
      <div className={styles.container}>
         {HOMEPAGE_NAV_LINKS.map((link,id) => (
            <LinkDetailBox details={link} id={id} key={id}/>
         ))}
      </div>
   )
}