import Button from "@/common/components/Button";
import { useEffect, useState } from "react";

interface RewardsInfoProps {
   selectedCard: any;
   rewardsData: any[];
   fetchCards: () => void;
}

export default function RewardsInfo({ selectedCard, rewardsData, fetchCards}: RewardsInfoProps) {
   const [showForm, setShowForm] = useState(false);

   const handleCardRewardsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const rewardsType = formData.get('rewardsType');
      const rewardsId = rewardsData.find((reward) => reward.title === rewardsType)?.headingId;

      await fetch(`/api/cards/edit/${selectedCard.cardNumber}`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`,
         },
         body: JSON.stringify({
            rewardsType,
            rewardsId
         }),
      });
      alert('Rewards info updated successfully!');
      fetchCards()
      setShowForm(false);
   }

   const handleEditRewardsInfoClick = () => {
      setShowForm(true);
   }

   if (!selectedCard?.trackAllowed) {
      return (
         <div>
            <h2>Rewards Info</h2>
            <p>Tracking is not allowed for this card.</p>
         </div>
      );
   }


    return (
        <div>
            {selectedCard?.trackAllowed && selectedCard?.rewardsType && !showForm? (
               <div>
                  <h2>Rewards Info</h2>
                  <p>Rewards Type: {selectedCard?.rewardsType}</p>
                  <p>Spending Target: {rewardsData.find((reward) => selectedCard?.rewardsId === reward.rewardsId)?.column1?.spend}</p>
                  <Button onClick={handleEditRewardsInfoClick}>Edit rewards info</Button>
               </div>
            ) : (
               <form
                  onSubmit={handleCardRewardsSubmit}
               >
                  <h2>Provide Rewards Info</h2>
                  <div>
                     <label htmlFor="rewardsType">Rewards Type:</label>
                     <select id="rewardsType" name="rewardsType" required>
                        {rewardsData.map((reward, index) => (
                           <option key={index} value={reward.title}>
                              {reward.title}
                           </option>
                        ))}
                     </select>
                  </div>
                  <Button type="submit">Submit</Button>
               </form>
            )}
        </div>
    );
}