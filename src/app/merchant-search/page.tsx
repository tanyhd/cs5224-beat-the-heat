import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import MerchantSearchForm from "@/features/merchantsSearch/MerchantsSearchForm";
import styles from './MerchantSearchPage.module.css'

const MERCHANT_SEARCH_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Merchant Search", href: "/merchant-search" },
];

export default function MerchantSearchPage() {
  return (
    <div>
      <Breadcrumb links={MERCHANT_SEARCH_BREADCRUMBS} />
      <Header headerText="Merchant Search" captionText="" containerClassName={styles.headerContainer}/>
      <MerchantSearchForm />      
    </div>
  );
}