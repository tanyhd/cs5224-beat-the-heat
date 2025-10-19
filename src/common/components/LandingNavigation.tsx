import Tag from "../icons/Tag"
import TrendingUp from "../icons/TrendingUp"
import Grid from "../icons/Grid"
import CreditCard from "../icons/CreditCard"
import styles from "./LandingNavigation.module.css"
import {LinkDetailBox} from "./DetailBox"

const HOMEPAGE_NAV_LINKS = [
   {
     label: 'Chill Challenge Hub',
     subLabel: 'Join walking or cycling challenges to stay active and cool',
     linkText: 'Challenge Hub',
     link: '/challengeHub',
     icon: <Tag stroke={"#06B6D4"}/>
   },
   {
     label: 'Track Expenditure',
     subLabel: 'Monitor your spending patterns and stay on top of your finances.',
     linkText: 'View Expenses',
     link: '/cards/track-card',
     icon: <TrendingUp stroke={"#06B6D4"}/>
   },
   {
      label: 'Manage Merchants on Card',
      subLabel: 'See all merchants where your card has been used for transactions.',
      linkText: 'Manage Merchants',
      link: '/card-on-file',
      icon: <CreditCard stroke={"#06B6D4"}/>
    },
    {
      label: 'Search Merchants',
      subLabel: "Check for merchants' MCC to see if they are eligible for offers.",
      linkText: 'Search Merchants',
      link: '/merchant-search',
      icon: <Grid stroke={"#06B6D4"}/>
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