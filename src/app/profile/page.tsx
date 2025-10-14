import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import Profile from "@/features/user/UserProfile";
import styles from './ProfilePage.module.css';

const PROFILE_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Profile Settings", href: "/profile" },
]

export default function ProfilePage() {
  return (
    <>
      <Breadcrumb links={PROFILE_BREADCRUMBS}/>
      <Header headerText="Profile Settings" captionText="" containerClassName={styles.headerContainer} />
      <Profile />
    </>
  );
}