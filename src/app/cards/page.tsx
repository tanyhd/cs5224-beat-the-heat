import UserCards from "@/features/user/UserCards";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import styles from "./CardsPage.module.css";


const CARDMANAGEMENT_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Card Management", href: "/cards" },
]

export default function CardsPage() {

  return (
    <>
      <Breadcrumb links={CARDMANAGEMENT_BREADCRUMBS} />
      <Header headerText="Your Cards" captionText="" containerClassName={styles.headerContainer} />
      <UserCards />
    </>
  );
}