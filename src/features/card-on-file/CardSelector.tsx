import Button from "@/common/components/Button"
import Dropdown from "@/common/components/Dropdown"
import SlimArrowRight from "@/common/icons/SlimArrowRight"

interface CardDetailProps {
  cardNumber: string
  provider: string
}

interface CardDetailsProps {
  cardDetails: CardDetailProps[]
  setSelectedCard: (card: CardDetailProps | null) => void
  selectedCard?: CardDetailProps | null
}

export default function CardDetailSelector({ cardDetails, setSelectedCard, selectedCard }: CardDetailsProps) {
  return (
    <>
      {cardDetails.length > 0 ? (
        <>
          <h3 style={{ margin: '36px 0 24px' }}>Select a card</h3>
          <Dropdown
            options={["Choose a card", ...cardDetails.map(card => card.cardNumber)]}  // Include default empty option
            name="cardSelector"
            value={selectedCard?.cardNumber || ""}  // Show empty string if nothing selected
            onChange={(event) => {
              const selectedValue = event.target.value;
              const matchedCard = cardDetails.find(card => card.cardNumber === selectedValue);
              setSelectedCard(matchedCard || null);  // If no match (""), set null
            }}
            icon={<SlimArrowRight />}
          />
        </>
      ) : (
        <Button href="/challenges">Please add a card to track</Button>
      )}
    </>
  );
}
