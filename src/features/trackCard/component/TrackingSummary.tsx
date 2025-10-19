import { LinkDetailBox } from "@/common/components/DetailBox";
import Calendar from "@/common/icons/Calendar";
import Clock from "@/common/icons/Clock";
import DollarSign from "@/common/icons/DollarSign";
import Target from "@/common/icons/Target";
import extractDays from "@/common/utils/extractDays";
import styles from './TrackingSummary.module.css';

interface TrackingSummaryProps {
   selectedRewardsData: any;
   selectedCard: any;
}

export default function TrackingSummary({ selectedRewardsData, selectedCard }: TrackingSummaryProps) {
   const { expenses, trackAllowed } = selectedCard || {};
   const totalExpenses = expenses?.reduce((acc: number, expense: any) => acc + parseFloat(expense.amount), 0) || 0;
   const spendingTarget = selectedRewardsData?.column1?.spend || 0;
   const spendingPeriod = extractDays(selectedRewardsData?.column1?.spendPeriod) || 0;
   const daysFromStart = selectedCard?.cardApprovalDate ? Math.floor((new Date().getTime() - new Date(selectedCard.cardApprovalDate).getTime()) / (1000 * 3600 * 24)) : 0;
   const remainingDays = spendingPeriod - daysFromStart;
   const supposedEndDate = new Date(new Date(selectedCard?.cardApprovalDate).getTime() + (spendingPeriod * 24 * 60 * 60 * 1000));

   if (!trackAllowed) { return null }

   return (
      <div>
         <h3 style={{ margin: '36px 0 24px' }}>Rewards & Tracking Summary</h3>
         <div className={styles.summaryContainer}>
            <LinkDetailBox
               key={1}
               id={1}
               details={{
                  label: 'Spending Target',
                  subLabel: spendingTarget,
                  icon: <Target stroke="#06B6D4" />
               }}
            />
            <LinkDetailBox
               key={2}
               id={2}
               details={{
                  label: 'Remaining Amount',
                  subLabel: `${(spendingTarget - totalExpenses).toFixed(2)}`,
                  icon: <DollarSign stroke="#06B6D4" />
               }}
            />
            <LinkDetailBox
               key={3}
               id={3}
               details={{
                  label: 'Approval Date',
                  subLabel: `${selectedCard?.cardApprovalDate}`,
                  icon: <Calendar stroke="#06B6D4" />
               }}
            />
            <LinkDetailBox
               key={4}
               id={4}
               details={{
                  label: 'Remaining Days',
                  subLabel: remainingDays < 0 ? `The spending period is due on ${supposedEndDate}` : `${remainingDays} days`,
                  icon: <Clock stroke="#06B6D4" />
               }}
            />
         </div>
      </div>
   )
}