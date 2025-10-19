import { LinkDetailBox } from "@/common/components/DetailBox"
import RewardsInfo from "./RewardsInfo"
import CreditCard from "@/common/icons/CreditCard"
import Button from "@/common/components/Button"

interface detailedSelectedCardProps {
   cardNumber: string
   provider: string
   rewardsType: string
}

interface selectedCardProps {
   selectedCard: detailedSelectedCardProps
   selectedRewardsData: any
   fetchCards: () => void
}


export default function CardInfo ({selectedCard, selectedRewardsData, fetchCards}: selectedCardProps) {
   if (!selectedCard) {
      return null
   }
   if (!selectedCard?.rewardsType) {
      return <Button href="/cards">Please edit rewards info for this card</Button>
   }
   return (
      <>
         <div>
            <h3 style={{margin: '36px 0 24px'}}>Card Information</h3>
            <div style={{display: 'flex', flexDirection: 'row', gap: '16px'}}>
               <img src={selectedRewardsData?.imageUrl} alt="Card" style={{maxWidth: '280px', borderRadius: '8px'}} />
               <LinkDetailBox 
                  id={1} 
                  key={1} 
                  details={{
                  label: selectedCard?.rewardsType, 
                  subLabel: <>Card Provider: {selectedCard?.provider}<br />Card Number: {selectedCard?.cardNumber}</>,
                  icon: <CreditCard stroke="#06B6D4" />
                  }}
               />
            </div>
            {/* <RewardsInfo selectedCard={selectedCard} rewardsData={rewardsData} fetchCards={fetchCards}/> */}
         </div> 
      </>
   )
}