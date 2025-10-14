import SlimArrowRight from "../icons/SlimArrowRight";
import styles from "./Breadcrumb.module.css";

interface BreadcrumbProps {
   links: {
      name: string;
      href: string;
   }[];
}

export default function Breadcrumb ({links}: BreadcrumbProps) {
   return (
      <nav className={styles.container} aria-label="Breadcrumb">
         <ol className={styles.outline}>
            {links.map((link, index) => (
               <li key={index} className={styles.item}>
                  <a href={link.href} className={styles.linkText}>
                     {link.name}
                  </a>
                  {index < links.length - 1 && (
                     <SlimArrowRight className={styles.icon}/>
                  )}
               </li>
            ))}
         </ol>
      </nav>
   )

}