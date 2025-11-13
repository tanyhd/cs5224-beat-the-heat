// import CreditCardAddForm from "@/features/creditCardAdd/CreditCardAddForm";

// export default function AddCreditCardsPage() {
//   return (
//     <div>
//       <h2>Add Credit Cards</h2>
//       <CreditCardAddForm />
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";

import Breadcrumb from "@/common/components/Breadcrumb";
import Challenges from "../../features/challengeHub/component/ChallengeHub";
import Header from "@/common/components/Header";
import styles from "./ChallengePage.module.css";

const CHALLENGES_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Challenge Hub", href: "/challengeHub" },
];

export default function ChallengePage() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/challengeHub")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return (
    <div>
      <Breadcrumb links={CHALLENGES_BREADCRUMBS} />
      <Header
        headerText="Challenge Hub"
        captionText="Join walking or cycling challenges to stay active and cool"
        containerClassName={styles.container}
      />
      <Challenges challenges={data} />
    </div>
  );
}
