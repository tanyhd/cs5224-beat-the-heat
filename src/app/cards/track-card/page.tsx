import Header from "@/common/components/Header"
import TrackCard from "@/features/trackCard/component/TrackCard"
import styles from './TrackCardPage.module.css'
import Breadcrumb from "@/common/components/Breadcrumb"

const TRACK_CARD_BREADCRUMBS = [
   { name: "Home", href: "/" },
   { name: "Track Expenditure", href: "/cards/track-card" },
 ]

export default function TrackCardPage () {
   return (
      <div>
         <Breadcrumb links={TRACK_CARD_BREADCRUMBS}/>
         <Header headerText="Track Your Card Expenditure" captionText="" containerClassName={styles.headerContainer} />
         <TrackCard />
      </div>
   )
}