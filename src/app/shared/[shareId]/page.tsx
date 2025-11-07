"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/common/components/Breadcrumb";
import Header from "@/common/components/Header";
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";
import styles from "./SharedRoutePage.module.css";

const SHARED_ROUTE_BREADCRUMBS = [
  { name: "Home", href: "/" },
  { name: "Shared Route", href: "#" },
];

export default function SharedRoutePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  const [sharedRoute, setSharedRoute] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationState, setNotificationState] = useState({
    message: '',
    type: null as NotificationType,
  });

  useEffect(() => {
    const fetchSharedRoute = async () => {
      try {
        const response = await fetch(`/api/shared/${shareId}`);

        if (response.ok) {
          const data = await response.json();
          setSharedRoute(data.route);
        } else {
          setNotificationState({
            message: 'Shared route not found',
            type: NotificationTypeEnum.ERROR,
          });
        }
      } catch (error) {
        console.error('Error fetching shared route:', error);
        setNotificationState({
          message: 'Error loading shared route',
          type: NotificationTypeEnum.ERROR,
        });
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedRoute();
    }
  }, [shareId]);

  const handleViewOnMap = () => {
    if (sharedRoute) {
      // Store shared route data in sessionStorage to load it in the map
      sessionStorage.setItem('sharedRouteData', JSON.stringify(sharedRoute));
      router.push('/map?shared=true');
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb links={SHARED_ROUTE_BREADCRUMBS} />
        <Header
          headerText="Loading Shared Route..."
          captionText="Please wait while we load the route"
        />
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!sharedRoute) {
    return (
      <div>
        <Notification
          message={notificationState.message}
          type={notificationState.type}
          onClose={() => setNotificationState({ message: '', type: null })}
        />
        <Breadcrumb links={SHARED_ROUTE_BREADCRUMBS} />
        <Header
          headerText="Route Not Found"
          captionText="The shared route you're looking for doesn't exist"
        />
        <div className={styles.notFoundContainer}>
          <p>This route may have been deleted or the link is invalid.</p>
          <button
            onClick={() => router.push('/map')}
            className={styles.goToMapButton}
          >
            Go to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Notification
        message={notificationState.message}
        type={notificationState.type}
        onClose={() => setNotificationState({ message: '', type: null })}
      />
      <Breadcrumb links={SHARED_ROUTE_BREADCRUMBS} />
      <Header
        headerText={`📤 ${sharedRoute.routeName}`}
        captionText="Someone shared this route with you!"
      />

      <div className={styles.pageContainer}>
        <div className={styles.routeDetailsCard}>
          <h2 className={styles.routeDetailsTitle}>📍 Route Details</h2>

          <div className={styles.locationSection}>
            <strong className={styles.locationLabel}>From:</strong>
            <p className={styles.locationAddress}>
              {sharedRoute.origin.address}
            </p>
          </div>

          <div className={styles.locationSection}>
            <strong className={styles.locationLabel}>To:</strong>
            <p className={styles.locationAddress}>
              {sharedRoute.destination.address}
            </p>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Mode</div>
              <div className={styles.statValue}>
                {sharedRoute.preferences.travelMode === 'WALKING' ? '🚶 Walking' : '🚴 Bicycling'}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Shelter Level</div>
              <div className={styles.statValue}>
                {sharedRoute.preferences.shelterLevel}%
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Distance</div>
              <div className={styles.statValue}>
                {sharedRoute.routeData.distance}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Duration</div>
              <div className={styles.statValue}>
                {sharedRoute.routeData.duration}
              </div>
            </div>
          </div>

          <p className={styles.viewCount}>
            👁️ This route has been viewed {sharedRoute.viewCount} times
          </p>
        </div>

        <button
          onClick={handleViewOnMap}
          className={styles.viewOnMapButton}
        >
          🗺️ View Route on Map
        </button>
      </div>
    </div>
  );
}
