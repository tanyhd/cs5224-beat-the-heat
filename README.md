**Demo:** https://cs5224-beat-the-heat.vercel.app/
**Code (fork):** https://github.com/tanyhd/cs5224-beat-the-heat
**Original repo:** https://github.com/jocelynsursas/cs5224-beat-the-heat

A Next.js application for route planning with shelter optimization and temperature-aware navigation in Singapore.

## My contributions (Darren)
- Owned the end-to-end delivery of key features including authentication, route persistence/sharing, and temperature-aware routing: implementation, integration, testing, and deployment.
- Implemented authentication + account management: signup/login/logout, profile updates, bcrypt password hashing, token-based sessions with expiry.
- Built and integrated route saving/loading + shareable routes and ensured compatibility with the map UI and API routes.
- Integrated temperature data pipeline and route-level temperature statistics; validated correctness and improved reliability/performance.

## AI assistance note
Parts of the route saving, temperature integration, and map routing logic were developed with assistance from AI code generation tools. I reviewed the code, adapted it to the codebase, fixed bugs/edge cases, and ensured the final implementation works end-to-end in production.

## Deployment note
This fork is deployed on **Vercel**. The **scraping cron job is not enabled** in this deployment.



## Technical Details / Code Explanation

### Project Structure

The system is organised into logical modules to separate concerns between routing, authentication, user interface components and data access:

**src/app/**
- `api/`: Contains serverless API endpoints exposed by Next.js.
  - `routes/`: Endpoints for route CRUD operations and sharing.
  - `shared/`: Public access to shared routes.
  - `login/` and `signup/`: User authentication and registration endpoints.
  - `profile/`: User profile and account management.
  - `temperature/`, `challengeHub/`, `jobs/daily/`: Domain-specific APIs for temperature queries, event aggregation, and scheduled jobs.
- `map/`: Main route planning page where users configure routes and preferences.
- `shared/[shareId]/`: Public read-only route viewer for shared routes.
- `about/`: Static informational pages.

**src/common/components/**
- `Map.tsx`: Core Google Maps integration and route planning logic.
- `ShelterSlider.tsx`: User interface control for shelter preference.
- `Notification.tsx`: Toast notification component for user feedback.
- `Topnav.tsx`: Top navigation bar, including client-side access control.

**src/services/**
- `mongodb.js`: Database connection and common MongoDB operations.
- `scrape.js`: Web scraping logic for external event sources.

This modular structure supports maintainability and extensibility, allowing individual components and APIs to be developed and tested independently.

### Key Features

#### Route Planning with Shelter Optimization

The route planning feature is implemented primarily in `src/common/components/Map.tsx` (functions such as `calculateRoute` and `calculateShelterParams`) together with `src/common/utils/shelteredLinkway.ts` (`selectOptimalLinkwayWaypoints`).

The routing algorithm operates in two phases:

**Baseline Route Calculation**
The system first uses the Google Maps API to compute a standard route between the origin and destination based on the selected travel mode.

**Shelter-Aware Refinement**
When the user sets a shelter preference above 0%, the system loads GeoJSON shelter data from `public/static-data/ShelteredLinkway.json`.

A dynamic buffer zone (between 200m and 500m) around the baseline route is used to filter candidate sheltered walkways.

The `selectOptimalLinkwayWaypoints` function selects shelter waypoints.

The route is then recomputed via these waypoints, producing one or more alternative routes that better satisfy the user's shelter preference.

This approach balances route optimality with user comfort by incorporating sheltered paths without excessively increasing travel distance.

#### Temperature Data Integration

Temperature integration is implemented in `src/common/components/Map.tsx` (e.g., `getRouteTemperatureStats`) and the API route `src/app/api/temperature/route.ts`.

The main steps are:
1. The server periodically fetches real-time air temperature data from the Singapore government API (`api-open.data.gov.sg/v2/real-time/api/air-temperature`), with a 5-minute caching window to reduce latency and API load.
2. Route polyline coordinates are matched to the nearest weather stations using the Haversine formula.
3. For each route, the system computes and displays summary statistics, including average temperature along the route and maximum temperature encountered along the route.
4. Users can then compare alternative routes not only by distance or time, but also by their thermal conditions.

#### Route Saving and Loading

Persistent route storage is handled by `src/app/api/routes/route.js` and `src/services/mongodb.js` (e.g., `saveRoute`).

Key aspects include:
- Authenticated users can save routes to the `savedRoutes` collection.
- Each saved route stores:
  - Origin and destination coordinates.
  - Travel mode (e.g., walking, driving).
  - Shelter preference value.
  - Selected route index (if multiple routes are available).
- When users return to the application, they can reload previously saved routes. The system reconstructs the route using the stored parameters, ensuring that the user sees the same route configuration and options as before.

#### Route Sharing

Route sharing is implemented via `src/app/api/routes/share/route.js` and the public viewer at `src/app/shared/[shareId]/page.tsx`.

The mechanism works as follows:
1. When a user chooses to share a route, the system generates a secure, 8-character identifier using `crypto.randomBytes()`.
2. Metadata about the shared route, including its reference to a saved route, is stored in the `sharedRoutes` collection.
3. To avoid duplicate entries, if a route has already been shared, the same `shareId` is reused.
4. Public users can access shared routes via a URL of the form `/shared/[shareId]` without needing to log in.
5. The system also tracks view counts for each shared route to support basic analytics on route popularity.

#### Web Scraping and Event Aggregation

Event aggregation and scraping are implemented in `src/services/scrape.js`, `src/app/api/challengeHub/route.js`, and `src/app/api/jobs/daily/route.js`.

The process is:
1. The system periodically scrapes event listings from:
   - HealthHub
   - NParks
   - ActiveSG
2. Cheerio and Puppeteer are used to fetch and parse HTML content from these sources.
3. Extracted events (such as health and fitness programmes, outdoor activities, and community sports events) are cleaned and normalised before being stored in the `scrapedData` collection.
4. The Challenge Hub frontend retrieves this data via the `/api/challengeHub` endpoint and displays it in a consolidated view for users.
5. AWS EventBridge triggers the scraping process daily at 8am by invoking `/api/jobs/daily` with an API key (`DAILY_CRON_TOKEN`) for authentication.

#### Authentication System

Authentication and user management are handled by `src/app/api/login/route.js`, `src/app/api/signup/route.js`, and supporting functions in `src/services/mongodb.js` (`checkUserToken`, `addNewUser`).

The main components of the authentication system are:

**Token-Based Sessions**
- Session tokens are implemented as MongoDB ObjectId hex strings.
- Tokens are associated with user accounts and have a three-day expiration period.

**Password Security**
- User passwords are hashed using bcrypt before storage.

**User Registration**
- New users must register with a unique email address.
- Auto-incrementing numeric user IDs are generated using the `counters` collection.

**Client-Side Protection**
- The `Topnav.tsx` component performs client-side token validation to control access to authenticated pages.
- Public content, such as shared routes (`/shared/[shareId]`), remains accessible without authentication.

This design provides a lightweight but secure authentication mechanism suitable for a serverless Next.js environment while ensuring a clear separation between public and authenticated features.

---

## Development Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Environment Configuration

Create a file named `.env.local` in the project root with:
```bash
MONGODB_URI="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net"
MONGODB_DBNAME="beat_the_heat"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your api key"
DAILY_CRON_TOKEN="your cron token for scheduled jobs"
```

### 3) Run Development Server
```bash
npm run dev
```

### 4) Build for Production
```bash
npm run build
npm start
```
