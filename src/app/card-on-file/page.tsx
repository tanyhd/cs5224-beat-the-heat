import CardOnFileForm from "@/features/card-on-file/CardOnFileForm";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import styles from './CardOnFilePage.module.css';

const CARD_ON_FILE_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Merchants on Card", href: "/card-on-file" },
];

export default function CardOnFilePage() {
  return (
    <div>
      <Breadcrumb links={CARD_ON_FILE_BREADCRUMBS} />
      <Header headerText="Merchants on Card" captionText="" containerClassName={styles.headerContainer}/>
      <CardOnFileForm />      
    </div>
  );
}