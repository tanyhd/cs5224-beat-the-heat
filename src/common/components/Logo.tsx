import BluePin from "../icons/BluePin";
import styles from "./Logo.module.css";

interface LogoProps {
  showText?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Logo({ showText = true, size = "medium", className }: LogoProps) {
  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  return (
    <a href="/" className={`${styles.logo} ${sizeClasses[size]} ${className || ""}`}>
      <BluePin className={styles.icon} />
      {showText && <span className={styles.text}>Beat The Heat</span>}
    </a>
  );
}
