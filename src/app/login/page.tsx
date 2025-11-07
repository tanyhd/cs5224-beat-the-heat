'use client';

import { useState } from "react";
import { handleLogin } from "@/features/auth/component/Login";
import Header from "@/common/components/Header";
import styles from "./Login.module.css";
import Mail from "@/common/icons/Mail";
import Eye from "@/common/icons/Eye";
import EyeOff from "@/common/icons/EyeOff";
import Button from "@/common/components/Button";
import InputLabel from "@/common/components/InputLabel";
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";

export default function LoginPage() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string>("");
   const [passwordVisible, setPasswordVisible] = useState(false);
   const [notificationState, setNotificationState] = useState({
      message: '' as string,
      type: null as NotificationType,
   });

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");

      try {
         const data = await handleLogin(email, password);
         setNotificationState({
            message: "Login successful!",
            type: NotificationTypeEnum.SUCCESS,
        })

         setEmail('');
         setPassword('');
         sessionStorage.setItem('userToken', data.token);
         location.href = "/"

      } catch (err) {
         if (err instanceof Error) {
            setNotificationState({
                message: err.message,
                type: NotificationTypeEnum.ERROR,
            })
        } else {
            setNotificationState({
                message: "Login failed",
                type: NotificationTypeEnum.ERROR,
            })
        }
      }
   };

   return (
      <>
         <Notification
            message={notificationState.message}
            type={notificationState.type}
            onClose={() => { setNotificationState({ message: '', type: null }) }}
         />
         <Header headerText="Welcome Back" captionText="Sign in to access your card management dashboard" captionTextClassName={styles.captionText}/>
         <form onSubmit={handleSubmit} className={styles.form}>
            <InputLabel
               labelProps={{ text: 'Email' }}
               inputProps={{
                  type: "email",
                  placeholder: "Enter your email address",
                  value: email,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
                  required: true,
               }}
               icon={<Mail />}
            />
            <InputLabel
               labelProps={{ text: 'Password' }}
               inputProps={{
                  type: passwordVisible ? "text" : "password",
                  placeholder: "Enter your password",
                  value: password,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
                  required: true,
               }}
               icon={passwordVisible ?
                  <EyeOff
                     className={styles.eyeIcon}
                     onClick={() => setPasswordVisible(!passwordVisible)}
                  /> :
                  <Eye
                     className={styles.eyeIcon}
                     onClick={() => setPasswordVisible(!passwordVisible)}
                  />
               }
            />
            <Button type="submit">
               Sign In
            </Button>
            <p className={styles.error}>{error}</p>
            <p className={styles.caption}>Don't have an account? <span><a className={styles.link} href="/signup">Sign Up</a></span></p>
         </form>
      </>
   );
}