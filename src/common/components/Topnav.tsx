'use client';

import NAV_LINKS from "../constants/navlinks";
import styles from "./Topnav.module.css";
import React, { useState, useEffect } from 'react';
import Tag from "../icons/Tag";
import TrendingUp from "../icons/TrendingUp";
import Grid from "../icons/Grid";
import Avatar from "../icons/Avatar"; 
import CreditCard from "../icons/CreditCard";
import Logout from "../icons/Logout";
import Modal from "./Modal";
import Header from "./Header";
import Loading from "./Loading";
import { LOADING_DELAY } from "../constants/loadingDelay";
import LoadingDots from "./LoadingDots";
import BluePin from "../icons/BluePin";


const NON_AUTH_PAGES=['/', '/login', '/signup', '/home', '/merchant-search', '/challengeHub', '/map'];
const ICON_MAP: Record<'TAG' | 'TRENDINGUP' | 'GRID' | 'CREDITCARD' | 'BLUEPIN', React.JSX.Element> = {
   BLUEPIN: <BluePin />,
   TAG: <Tag />,
   TRENDINGUP: <TrendingUp />,
   GRID: <Grid />,
   CREDITCARD: <CreditCard />
};

const Topnav: React.FC = () => {
   const [isAuthModalOpen ,setIsAuthModalOpen] = useState(false);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [profileMenuToggle, setProfileMenuToggle] = useState(false);
   const [isMounted, setIsMounted] = useState(false);

   useEffect(() => {
      const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');
      setIsAuthenticated(!!token);
      setIsMounted(true);
      if (!token && !NON_AUTH_PAGES.includes(location.pathname)) {
         setIsAuthModalOpen(true);
      }
   }, []);

   return (
      <nav className={styles.nav}>
         <Modal
            isOpen={isAuthModalOpen}
            onAfterOpen={() => {
               setTimeout(() => {
                  location.href="/login" 
               }, LOADING_DELAY);
            }}
         >
            <div className={styles.modalContent}>
               <Header headerText="This is members only page" captionText="You need to login to access this page." captionTextClassName={styles.captionText}/>
               <Loading>
                  <span className={styles.loadingText}>You will be redirected to login page soon<LoadingDots /></span>
               </Loading>
            </div>
         </Modal>
         <div className={styles.left}>
            {NAV_LINKS.map((link) => (
               <a
                  key={link.path}
                  href={link.path}
                  className={styles.link}
               >
                  {link.icon && ICON_MAP[link.icon as keyof typeof ICON_MAP]}
                  {link.label}
               </a>
            ))}
         </div>
         {isMounted && <div className={styles.right}>
            {isAuthenticated ? (
               <>
                  <Avatar stroke={"#06B6D4"} className={styles.avatar} onClick={() => {setProfileMenuToggle(!profileMenuToggle)}}/>
                  <div className={styles.profileMenu} style={{display: profileMenuToggle ? 'block' : 'none'}}>
                     <a href="/profile" className={styles.profileSubMenu}><Avatar stroke={"#06B6D4"} className={styles.subAvatar}/>Manage Profile</a>
                     <a href="/cards" className={styles.profileSubMenu}><CreditCard stroke={"#FF5827"} className={styles.subAvatar}/>Manage Cards</a>
                     <a href="/login" className={styles.profileSubMenu} onClick={() => {sessionStorage.removeItem('userToken')}}><Logout stroke="#06B6D4" className={styles.subAvatar}/>Sign out</a>
                  </div>
               </>
            ) : (
               <>
                  <a href="/login" className={styles.login}>Login</a>
                  <a href="/signup" className={styles.signup}>Sign up</a>
               </>
            )}
         </div>}
      </nav>
   );
};


export default Topnav;