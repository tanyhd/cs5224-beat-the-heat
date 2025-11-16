import Button from "@/common/components/Button"
import Dropdown from "@/common/components/Dropdown"
import SlimArrowRight from "@/common/icons/SlimArrowRight"
import { useEffect } from "react"

interface CardDetailProps {
   cardNumber: string
   provider: string

}

interface CardDetailsProps {
   cardDetails: CardDetailProps[]
   setSelectedCard: (card: CardDetailProps) => void
   selectedCard?: CardDetailProps
}

export default function CardDetailselector({ cardDetails, setSelectedCard, selectedCard }: CardDetailsProps) {
   const cardInfo = selectedCard || cardDetails[0];
   useEffect(() => {
      if (cardDetails.length > 0 && !selectedCard) {
         setSelectedCard(cardDetails[0]);
      }
   }, [cardDetails, selectedCard, setSelectedCard]);
   return (
      <>
         <h3 style={{ margin: '36px 0 24px' }}>Select a card</h3>
         {cardDetails.length > 0 ? (
            <Dropdown
               options={cardDetails.map((card) => card.cardNumber)}
               name="cardSelector"
               value={cardInfo.cardNumber}
               onChange={(event) => {
                  const selectedCard = cardDetails.find(card => card.cardNumber === event.target.value);
                  if (selectedCard) setSelectedCard(selectedCard);
               }}
               icon={<SlimArrowRight />}
            />
         ) : (
            <Button href="/challenges">Please add a card to track</Button>
         )}
      </>
   )
}