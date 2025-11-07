'use client';

import { useState } from "react";
import { handleSignup } from "@/features/auth/component/Signup";
import Header from "@/common/components/Header";
import styles from "./Signup.module.css";
import Mail from "@/common/icons/Mail";
import EyeOff from "@/common/icons/EyeOff";
import Eye from "@/common/icons/Eye";
import Avatar from "@/common/icons/Avatar";
import Checkbox from "@/common/icons/Checkbox";
import ToggleLeft from "@/common/icons/ToggleLeft";
import ToggleRight from "@/common/icons/ToggleRight";
import Button from "@/common/components/Button";
import InputLabel from "@/common/components/InputLabel";
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";

export default function SignupPage() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [name, setName] = useState("");
   const [error, setError] = useState<string>("");
   const [passwordVisible, setPasswordVisible] = useState(false);
   const [confirmPassword, setConfirmPassword] = useState("");
   const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
   const [checked, setChecked] = useState(false);
   const [notificationState, setNotificationState] = useState({
      message: '' as string,
      type: null as NotificationType,
   });

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!checked) {
         setNotificationState({
            message: "Please accept the terms and conditions",
            type: NotificationTypeEnum.WARNING,
         })
         return;
      }
      if (password !== confirmPassword) {
         setNotificationState({
            message: "Passwords do not match",
            type: NotificationTypeEnum.WARNING,
         })
         return;
      }

      try {
         const data = await handleSignup(email, name, password);
         setNotificationState({
            message: "Account created successfully.",
            type: NotificationTypeEnum.SUCCESS,
         })
         setEmail('');
         setName('');
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
               message: "Sign up failed. Please try again.",
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
         <Header headerText="Create Your Account" captionText="Plan your routes and find cool spots to beat the heat" captionTextClassName={styles.captionText} headerClassName={styles.header}/>
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
               labelProps={{ text: 'Name' }}
               inputProps={{
                  type: "name",
                  placeholder: "Enter your name",
                  value: name,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
                  required: true,
               }}
               icon={<Avatar />}
            />
            <InputLabel
               labelProps={{ text: 'Password' }}
               inputProps={{
                  type: passwordVisible ? "text" : "password",
                  placeholder: "Create a strong password",
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
            <InputLabel
               labelProps={{ text: 'Confirm Password' }}
               inputProps={{
                  type: confirmPasswordVisible ? "text" : "password",
                  placeholder: "Re-enter your password",
                  value: confirmPassword,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
                  required: true,
               }}
               icon={confirmPasswordVisible ?
                  <EyeOff
                     className={styles.eyeIcon}
                     onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  /> :
                  <Eye
                     className={styles.eyeIcon}
                     onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
               }
            />
            <div className={styles.checkboxContainer}>
               <Checkbox className={styles.checkboxIcon} stroke="#06B6D4" />
               <div className={styles.checkboxText}>
                  <h4>Terms and Conditions</h4>
                  <p className={styles.checkboxCaption}>I agree to the Terms of Service and Privacy Policy</p>
               </div>
               {checked ? <ToggleRight onClick={() => setChecked(false)} /> : <ToggleLeft className={styles.toggleLeft} onClick={() => setChecked(true)} />}
            </div>

            <Button type="submit">
               Create Account
            </Button>
            <p className={styles.caption}>Already have an account? <span><a className={styles.link} href="/login">Log in</a></span></p>
         </form>

      </>
   );
}