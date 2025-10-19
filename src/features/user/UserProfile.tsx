"use client";

import { useState, useEffect, FormEvent } from "react";
import styles from './Profile.module.css'
import { LinkDetailBox } from "@/common/components/DetailBox";
import Avatar from "@/common/icons/Avatar";
import Button from "@/common/components/Button";
import InputLabel from "@/common/components/InputLabel";
import EyeOff from "@/common/icons/EyeOff";
import Eye from "@/common/icons/Eye";
import Mail from "@/common/icons/Mail";
import { LOADING_DELAY } from "@/common/constants/loadingDelay";
import Loading from "@/common/components/Loading";
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";

const HEADER_DETAIL_BOX = {
    label: 'Personal Information',
    subLabel: 'Update your email address and manage your account security',
    icon: <Avatar stroke={"#06B6D4"} />
}


interface UserProfile {
    userId: number;
    name: string;
    email: string;
    createdAt: string;
}

export default function Profile() {
    const [isLoading, setIsLoading] = useState(true)
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editedName, setEditedName] = useState("");
    const [editedEmail, setEditedEmail] = useState("");
    const [notificationState, setNotificationState] = useState({
        message: '' as string,
        type: null as NotificationType,
    });

    // States for change password form
    const [oldPassword, setOldPassword] = useState("");
    const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    // Profile delete 
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');
        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem("userToken");
                if (!token) throw new Error("Please log in.");

                const response = await fetch("/api/profile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    }
                });

                if (!response.ok) {
                    sessionStorage.removeItem('userToken');
                    throw new Error("Unable to load your profile. Please try again.");
                }

                const data: UserProfile = await response.json();
                setProfile(data);
                setEditedName(data.name);
                setEditedEmail(data.email);
                setTimeout(() => {
                    setIsLoading(false);
                }, LOADING_DELAY);
            } catch (err) {
                if (err instanceof Error) {
                    setNotificationState({
                        message: err.message,
                        type: NotificationTypeEnum.ERROR,
                    })
                } else {
                    setNotificationState({
                        message: "An unexpected error occurred",
                        type: NotificationTypeEnum.ERROR,
                    })
                }
            }
        };
        token && fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!editedName.trim() || !editedEmail.trim()) {
            setNotificationState({
                message: "Name and Email cannot be empty!",
                type: NotificationTypeEnum.WARNING,
            });
            return;
        }

        const oldProfile = profile;

        try {
            const token = sessionStorage.getItem("userToken");
            if (!token) throw new Error("Unauthorized");

            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: editedName,
                    email: editedEmail,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setProfile(oldProfile);
                throw new Error(data.error || "Failed to update profile");
            }

            setProfile(data);
            setNotificationState({
                message: "Success! Your email address has been updated.",
                type: NotificationTypeEnum.SUCCESS,
            })
        } catch (err) {
            setProfile(oldProfile);
            if (err instanceof Error) {
                setNotificationState({
                    message: err.message,
                    type: NotificationTypeEnum.ERROR,
                })
            } else {
                setNotificationState({
                    message: "An unexpected error occurred",
                    type: NotificationTypeEnum.ERROR,
                })
            }
        }
    };


    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setNotificationState({
                message: "New password and confirmation do not match.",
                type: NotificationTypeEnum.WARNING,
            })
            return;
        }

        try {
            const token = sessionStorage.getItem("userToken");
            if (!token) throw new Error("Unauthorized");

            const response = await fetch("/api/profile/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to change password");
            }

            setNotificationState({
                message: "Success! Your password has been updated.",
                type: NotificationTypeEnum.SUCCESS,
            })

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            if (err instanceof Error) {
                setNotificationState({
                    message: err.message,
                    type: NotificationTypeEnum.ERROR,
                })
            } else {
                setNotificationState({
                    message: "An unexpected error occurred",
                    type: NotificationTypeEnum.ERROR,
                })
            }
        }
    };

    const handleDelete = async () => {
        try {
            const token = sessionStorage.getItem("userToken");
            if (!token) throw new Error("Unauthorized");

            const response = await fetch("/api/profile/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to delete user profile");
            }

            sessionStorage.removeItem('userToken');
            setNotificationState({
                message: "Your profile has been successfully removed.",
                type: NotificationTypeEnum.SUCCESS,
            })
            location.href = "/signup"
        } catch (err) {
            if (err instanceof Error) {
                setNotificationState({
                    message: err.message,
                    type: NotificationTypeEnum.ERROR,
                })
            } else {
                setNotificationState({
                    message: "An unexpected error occurred",
                    type: NotificationTypeEnum.ERROR,
                })
            }
        }
    };

    if (!profile || isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loading />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <Notification
                message={notificationState.message}
                type={notificationState.type}
                onClose={() => { setNotificationState({ message: '', type: null }) }}
            />
            <LinkDetailBox key={1} id={1} details={HEADER_DETAIL_BOX} cardClassName={styles.card} />
            <InputLabel
                labelProps={{ text: 'Name' }}
                inputProps={{
                    type: "text",
                    placeholder: "Enter your name",
                    value: profile.name,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value),
                    required: true,
                    disabled: true,
                    style: { pointerEvents: "none", backgroundColor: "#f0f0f0" }
                }}
                icon={<Avatar />}
            />

            <h3 className={styles.subSection}>Email Address</h3>
            <InputLabel
                labelProps={{ text: 'Email Address' }}
                inputProps={{
                    type: "email",
                    placeholder: "Enter your email address",
                    value: editedEmail ?? profile.email,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditedEmail(e.target.value),
                    required: true,
                }}
                icon={<Mail />}
            />
            <Button onClick={handleSave} classNameProps={styles.button}>Change Email</Button>
            {/* Change Password Form */}
            <div style={{ marginTop: "20px" }}>
                <h3 className={styles.subSection}>Password</h3>
                <form onSubmit={handleChangePassword}>
                    <InputLabel
                        labelProps={{ text: 'Current Password' }}
                        inputProps={{
                            type: oldPasswordVisible ? "text" : "password",
                            placeholder: "Enter current password",
                            value: oldPassword,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value),
                            required: true,
                        }}
                        icon={oldPasswordVisible ?
                            <EyeOff
                                className={styles.eyeIcon}
                                onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
                            /> :
                            <Eye
                                className={styles.eyeIcon}
                                onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
                            />}
                    />
                    <InputLabel
                        labelProps={{ text: 'New Password' }}
                        inputProps={{
                            type: newPasswordVisible ? "text" : "password",
                            placeholder: "Enter new password",
                            value: newPassword,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value),
                            required: true,
                        }}
                        icon={newPasswordVisible ?
                            <EyeOff
                                className={styles.eyeIcon}
                                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                            /> :
                            <Eye
                                className={styles.eyeIcon}
                                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                            />}
                    />
                    <InputLabel
                        labelProps={{ text: 'Confirm New Password' }}
                        inputProps={{
                            type: confirmPasswordVisible ? "text" : "password",
                            placeholder: "Re-enter new password",
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
                            />}
                    />
                    <Button type="submit" classNameProps={styles.button}>Change Password</Button>
                </form>
            </div>
            {/* Delete Profile Section */}
            <div style={{ marginTop: '20px', marginBottom: '48px' }}>
                {!isConfirmingDelete ? (
                    <Button onClick={() => setIsConfirmingDelete(true)} classNameProps={styles.button}>Delete Profile</Button>
                ) : (
                    <div className={styles.confirmDelete}>
                        <p>Are you sure you want to delete your profile?</p>
                        <div className={styles.confirmDeleteButtons}>
                            <Button variant="secondary" onClick={handleDelete} classNameProps={styles.button}>Confirm</Button>
                            <Button variant="primary" onClick={() => setIsConfirmingDelete(false)} classNameProps={styles.button}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}