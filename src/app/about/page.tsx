'use client';

import styles from "./page.module.css";
import Header from "../../common/components/Header";

export default function About() {
  return (
    <main className={styles.main}>
      <Header
        headerText="About Beat The Heat"
        captionText="Navigate Singapore's urban heat with comfort and ease"
      />

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>What is Beat The Heat?</h2>
          <p>
            Singapore's increasing heat and humidity pose a major challenge to urban walking comfort,
            a problem projected to worsen with rising average temperatures. Existing digital wayfinding
            services fail to prioritize thermal comfort, focusing only on speed or distance.
          </p>
          <p>
            <strong>Beat the Heat</strong> recommends routes to pedestrians that minimize heat exposure and
            maximize comfort by leveraging data such as Singapore Trees, sheltered linkways, and underpasses.
            This is especially useful for people who walk, run, or cycle regularly, and can even encourage
            more Singaporeans to exercise by making them aware of cooler, more comfortable routes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How to Use Beat The Heat</h2>

          <div className={styles.feature}>
            <h3>🗺️ Breeze Navigator</h3>
            <p>
              Find the most thermally comfortable walking route between two locations. Our route planner
              prioritizes shaded paths, sheltered linkways, and tree-lined streets to minimize your heat
              exposure while getting you to your destination.
            </p>
            <p>
              <strong>Adjustable Shelter Preference:</strong> Use the shelter slider to control how much the
              route prioritizes sheltered linkways. Set it low for the fastest route with minimal shelter, or
              high to maximize coverage through sheltered areas. The route automatically adjusts to pass through
              numbered shelter points based on your preference.
            </p>
            <p>
              <strong>Temperature Display:</strong> View real-time temperature data along your route, including
              average and maximum temperatures, helping you make informed decisions about your journey.
            </p>
            <p>
              <strong>Save & Share Routes:</strong> Save your favorite routes for quick access later, and share
              them with friends or family via a shareable link. Perfect for planning group activities or sharing
              your go-to cool paths.
            </p>
            <p><em>Simply enter your start and end points, adjust your shelter preference, and let us find the coolest path for you.</em></p>
          </div>

          <div className={styles.feature}>
            <h3>🏆 Challenge Hub</h3>
            <p>
              Browse and join heat-beating challenges to stay motivated and earn rewards. Complete walking
              challenges, explore new cool routes, and compete with others while staying comfortable in
              Singapore's climate.
            </p>
            <p><em>Check out available challenges and start your journey today.</em></p>
          </div>

          <div className={styles.feature}>
            <h3>📊 Challenge Tracker</h3>
            <p>
              Monitor your progress on active challenges. Track your completed routes, view your achievements,
              and see how close you are to earning rewards.
            </p>
            <p><em>Stay on top of your goals and celebrate your milestones.</em></p>
          </div>

          <div className={styles.feature}>
            <h3>🤝 Sponsorship</h3>
            <p>
              Discover exclusive offers from our partners. Access deals on hydration products, fitness gear,
              and other items that help you beat the heat while exploring Singapore.
            </p>
            <p><em>Browse curated products and services that complement your active lifestyle.</em></p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Our Mission</h2>
          <p>
            We believe that thermal comfort should be a priority in urban navigation. By making cooler,
            more comfortable routes accessible to everyone, we aim to encourage more Singaporeans to stay
            active and explore their city—even on the hottest days.
          </p>
          <p>
            Beat the Heat is committed to making urban mobility more comfortable, sustainable, and enjoyable
            for all pedestrians, runners, and cyclists in Singapore.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Get Started</h2>
          <p>
            Ready to beat the heat? <a href="/signup" className={styles.link}>Create an account</a> to
            access personalized features, track your challenges, and unlock exclusive rewards. Or jump
            right in and start exploring with our <a href="/map" className={styles.link}>Breeze Navigator</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
