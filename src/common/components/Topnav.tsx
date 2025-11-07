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
import Beat from "../icons/Beat";
import Trophy from "../icons/Trophy";
import Handshake from "../icons/Handshake";
import Info from "../icons/Info";
import Menu from "../icons/Menu";
import X from "../icons/X";
import Logo from "./Logo";
import Lock from "../icons/Lock";
import AvatarPlus from "../icons/AvatarPlus";


const NON_AUTH_PAGES=['/', '/login', '/signup', '/home', '/merchant-search', '/challengeHub', '/map', '/about', '/shared'];
const ICON_MAP: Record<'TAG' | 'TRENDINGUP' | 'GRID' | 'BEAT' | 'TROPHY' | 'HANDSHAKE' | 'BLUEPIN' | 'INFO', React.JSX.Element> = {
   BLUEPIN: <BluePin />,
   TAG: <Tag />,
   TRENDINGUP: <TrendingUp />,
   GRID: <Grid />,
   BEAT: <Beat />,
   TROPHY: <Trophy stroke="#052F5F" />,
   HANDSHAKE: <Handshake stroke="#052F5F" />,
   INFO: <Info stroke="#052F5F" />,
};

const Topnav: React.FC = () => {
   const [isAuthModalOpen ,setIsAuthModalOpen] = useState(false);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [profileMenuToggle, setProfileMenuToggle] = useState(false);
   const [isMounted, setIsMounted] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   useEffect(() => {
      const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');
      setIsAuthenticated(!!token);
      setIsMounted(true);
      // Check if current path is a non-auth page or starts with a non-auth path prefix
      const isNonAuthPage = NON_AUTH_PAGES.some(page =>
         location.pathname === page || location.pathname.startsWith(page + '/')
      );
      if (!token && !isNonAuthPage) {
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

         {/* Mobile logo and menu */}
         <div className={styles.mobileHeader}>
            <Logo size="medium" className={styles.mobileLogo} />
            <button
               className={styles.mobileMenuButton}
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               aria-label="Toggle menu"
            >
               {mobileMenuOpen ? <X stroke="#052F5F" /> : <Menu stroke="#052F5F" />}
            </button>
         </div>

         {/* Mobile menu drawer */}
         {mobileMenuOpen && (
            <div className={styles.mobileMenuOverlay} onClick={() => setMobileMenuOpen(false)}>
               <div className={styles.mobileMenuDrawer} onClick={(e) => e.stopPropagation()}>
                  {NAV_LINKS.map((link) => (
                     <a
                        key={link.path}
                        href={link.path}
                        className={styles.mobileMenuLink}
                        onClick={() => setMobileMenuOpen(false)}
                     >
                        {link.icon && ICON_MAP[link.icon as keyof typeof ICON_MAP]}
                        <span>{link.label}</span>
                     </a>
                  ))}
                  {isMounted && (
                     <div className={styles.mobileMenuAuth}>
                        {isAuthenticated ? (
                           <>
                              <a href="/profile" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                                 <Avatar stroke={"#06B6D4"} />
                                 <span>Manage Profile</span>
                              </a>
                              <a href="/cards" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                                 <CreditCard stroke={"#FF5827"} />
                                 <span>Manage Cards</span>
                              </a>
                              <a href="/login" className={styles.mobileMenuLink} onClick={() => {sessionStorage.removeItem('userToken'); setMobileMenuOpen(false);}}>
                                 <Logout stroke="#06B6D4" />
                                 <span>Sign out</span>
                              </a>
                           </>
                        ) : (
                           <>
                              <a href="/login" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                                 <Lock stroke="#06B6D4" />
                                 <span>Login</span>
                              </a>
                              <a href="/signup" className={styles.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>
                                 <AvatarPlus stroke="#06B6D4" />
                                 <span>Sign up</span>
                              </a>
                           </>
                        )}
                     </div>
                  )}
               </div>
            </div>
         )}

         <div className={styles.left}>
            {NAV_LINKS.map((link) => (
               <a
                  key={link.path}
                  href={link.path}
                  className={styles.link}
               >
                  {link.icon && ICON_MAP[link.icon as keyof typeof ICON_MAP]}
                  <span className={styles.labelWrapper}>{link.label}</span>
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