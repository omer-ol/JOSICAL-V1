
**JOSIAL**
The Social Platform for Dog Owners in Israel


**Comprehensive Build Plan & Feature Specification**
Version 1.0  |  February 2026
**MVP: Social-First Approach**

# Executive Summary
Josial is a mobile-first social platform that consolidates the fragmented Israeli dog-owner ecosystem. Currently, dog owners rely on Facebook groups, WhatsApp groups, and scattered networks. Josial brings everything together: social connections, dog profiles, location discovery, real-time messaging, and eventually a service marketplace.


# Key Architectural Decisions


# Phased Build Roadmap
Each phase builds on the previous one and adds a new reason for users to stay. The social core must feel solid before layering on location and marketplace features.


# Phase 0: Authentication & Onboarding
The foundation of the app. Every feature depends on users being able to register, log in, and set up their identity. This phase must feel fast, smooth, and welcoming.
## Feature: Registration Flow
**User Story: As a new dog owner, I want to quickly sign up for Josial so I can start connecting with other dog owners near me.**

### User Flow
User opens the app and sees the welcome screen with the Josial logo, tagline, and two buttons: Sign Up and Log In.
User taps Sign Up and sees a registration form with fields: Full Name, Email Address, Password, and Confirm Password.
User fills in the form and taps Create Account.
Backend validates input: email format, password strength (minimum 6 characters), passwords match, and email uniqueness.
If validation passes: account is created, a JWT token is issued, and the user is directed to the onboarding wizard.
If validation fails: inline error messages appear below the relevant fields (red text, subtle animation).

### UI/UX Details
Welcome screen: clean, minimal, with a friendly dog illustration or photo as background
Registration form: single-screen, no scrolling required. Fields stacked vertically with clear labels above each field.
Password strength indicator: simple colored bar below the password field (red/yellow/green).
Loading state: the Create Account button shows a spinner inside the button while processing.
Success transition: smooth fade animation into the onboarding wizard.

### Business Rules
Email must be unique across all accounts (case-insensitive comparison).
Password minimum: 6 characters (kept simple for MVP — complexity rules come later).
Full Name is required, minimum 2 characters.
No email verification required in MVP (simplifies onboarding — add later).

### Edge Cases
Duplicate email: show error message “This email is already registered. Try logging in instead.” with a link to login screen.
Network failure during registration: show a toast/snackbar “Connection error. Please try again.” and preserve the form state so the user doesn't need to re-enter everything.
User closes app mid-registration: form state is lost (acceptable for MVP). No partial accounts are created.

### Technical Requirements
API Endpoint: POST /api/auth/register with body { name, email, password }.
Response: { token, user: { id, name, email, createdAt } }.
Password hashing: bcrypt with salt rounds of 10 (even in MVP, never store plaintext).
JWT token: simple payload { userId, email }, 7-day expiry.
In-memory data store: users stored in a Map keyed by ID, with email index for uniqueness check.

## Feature: Login & Session Management
**User Story: As a returning user, I want to quickly log back into Josial and pick up where I left off.**

### User Flow
User taps Log In on the welcome screen.
Login form appears with Email and Password fields, plus a Forgot Password link.
User enters credentials and taps Log In.
Backend validates credentials. On success: JWT issued, user redirected to main app (home screen).
On failure: error message “Invalid email or password” (generic message for security — don’t reveal which was wrong).

### Session Management
JWT stored in React Native AsyncStorage (secure storage in future phases).
On app launch: check for stored token. If valid, skip login and go to home screen. If expired, redirect to login.
Token refresh: not in MVP. Token expires after 7 days, user logs in again.
Logout: clear token from storage, navigate to welcome screen.

### Password Reset (MVP Simplified)
For MVP, password reset is a simple flow: user enters their email, backend generates a 6-digit code (logged to console in development), user enters the code and new password. No actual email sending in the initial implementation — just the UI flow and API endpoints, with email integration added when needed.

## Feature: Onboarding Wizard
**User Story: As a new user, I want a quick guided setup so my profile and dog info are ready and I can start finding neighbors immediately.**

### User Flow (3-Step Wizard)
**Step 1: Your Profile**
Profile photo (optional — tap to upload from camera/gallery, or skip with a default avatar).
Bio (optional, max 200 characters): a short text about yourself as a dog owner.
Location: city/neighborhood selector or address input. This is critical for neighbor discovery.
A progress bar at the top shows Step 1 of 3.
**Step 2: Your Dog**
Dog Name (required).
Breed (required — dropdown with search/autocomplete from a pre-populated breed list).
Dog Photo (optional — camera/gallery upload, or default silhouette by breed).
Gender (Male/Female toggle).
Approximate age or DOB (simple date picker or “puppy / adult / senior” selector for MVP).
Neutered/Spayed (Yes/No toggle).
An “Add Another Dog” button below (creates another lightweight dog entry).
**Step 3: Discovery Preferences**
Discovery radius slider: 0.5km to 10km, default 2km.
Toggle: “Show me in neighbor discovery” (on by default).
Notification preferences: enable push notifications prompt (iOS permission dialog).
A “Get Started” button that completes onboarding and takes the user to the home screen.

### UI/UX Details
Each step is a full-screen card that slides left/right with swipe gestures and Next/Back buttons.
Skip button available on each step (except dog name which is required).
Smooth micro-animations when transitioning between steps.
Confetti or celebration animation when the user completes setup and taps Get Started.

### Technical Requirements
API: PUT /api/users/profile for user profile updates.
API: POST /api/dogs for adding dog profiles.
API: PUT /api/users/preferences for discovery settings.
Image upload: store locally in the in-memory store as base64 for MVP. Real storage (S3/Cloudinary) comes later.
Breed list: hardcoded JSON array of 200+ common breeds shipped with the app (no API call needed).

### Data Model


# Phase 1: Social Connection
The heart of Josial. This phase transforms the app from a profile tool into a living community. The core loop is: discover neighbors, send friend requests, build your dog-owner network.
## Feature: Neighbor Discovery
**User Story: As a dog owner, I want to discover other dog owners within walking distance so I can arrange playdates and build a local community.**

### User Flow
User navigates to the Discover tab (one of the main bottom tabs).
Screen shows a vertically scrolling list of nearby dog owner cards, sorted by distance (closest first).
Each card shows: owner avatar, owner name, their dog(s) with photos/names/breeds, and the approximate distance.
User can tap a card to view the full profile, or tap a “Add Friend” button directly on the card.
Radius filter: a small filter icon in the top-right opens a bottom sheet where the user can adjust the discovery radius (slider from 0.5km to 10km).

### Discovery Algorithm
Calculate the Haversine distance between the current user’s location and every other discoverable user.
Filter to users within the selected radius.
Exclude: the current user, blocked users, and users with isDiscoverable set to false.
Sort by distance ascending.
Pagination: return 20 users per page with infinite scroll.

### Cold Start Strategy
The biggest risk is a user opening the Discover tab and seeing nobody. To mitigate this:
If zero results within 2km, automatically expand and show “No neighbors within 2km. Showing dog owners within 10km.”
If still zero results, show a friendly empty state: “You’re the first one here! Invite friends to join Josial.” with a Share button (native share sheet).
Consider seeding the app with demo profiles during beta testing to avoid the empty-room feeling.

### UI/UX Details
Cards use a clean, white-background design with rounded corners and subtle shadows.
Dog photos are displayed as small circular thumbnails next to the dog’s name and breed.
Distance shown as “0.3 km away” or “1.5 km away” (one decimal place).
Pull-to-refresh to reload the list.
Skeleton loading cards while data is being fetched.

### Technical Requirements
API: GET /api/users/discover?lat={lat}&lng={lng}&radius={km}&page={n}&limit=20.
User location: obtained during onboarding, stored as { lat, lng }. For MVP, location is set once during onboarding (not real-time GPS).
Distance calculation: Haversine formula on the backend, computed at query time (acceptable performance for in-memory store with < 10k users).


## Feature: Friend Requests & Connections
**User Story: As a dog owner, I want to send and receive friend requests so I can build a trusted network of nearby dog owners.**

### User Flow: Sending a Request
User taps “Add Friend” on a discovery card or on someone’s profile.
Button changes to “Request Sent” (grayed out) with a subtle checkmark animation.
Recipient receives a push notification: “[Name] wants to connect with you!”
Recipient sees the request in their Notifications tab or a dedicated Friend Requests section.
### User Flow: Receiving a Request
User opens the notification or navigates to Friend Requests.
Sees a card with the requester’s profile summary (photo, name, dogs, distance).
Two buttons: Accept (green) and Decline (gray).
Accept: both users are now friends. Both see each other in their Friends list. A confirmation toast: “You and [Name] are now connected!”
Decline: request is removed silently. No notification to the sender.

### Connection States

### Business Rules
A user cannot send a friend request to someone they’ve already requested or are already friends with.
A user can cancel a pending outgoing request.
Declining a request does not prevent the declined user from sending a new request later (unless blocked).
Blocking a user: removes any existing friendship, hides both users from each other in all contexts (discovery, search, parks), and prevents any future requests.
Unfriending: removes the friendship but doesn’t block. Users can send a new friend request.

### Data Model: Friendships

## Feature: Friends List & User Search
**User Story: As a dog owner, I want to see all my connections and quickly find specific people so I can reach out to them.**

### Friends List
Accessible from the profile tab or a dedicated Friends section.
Shows all accepted friends as a vertical list with avatar, name, and their dog(s).
Search bar at the top to filter friends by name.
Tap on a friend to view their full profile. Long-press for quick actions (message, unfriend, block).
Sort options: alphabetical (default), recently added, distance.

### User Search
Global search bar accessible from the home screen or Discover tab.
Searches by user name, dog name, or breed.
Results show matching users as cards similar to the discovery view.
Debounced search: triggers after the user stops typing for 300ms.
Minimum 2 characters to trigger a search.

### Technical Requirements
API: GET /api/friends — returns the current user’s accepted friends list.
API: GET /api/users/search?q={query} — searches users and dogs by name/breed.
Search is simple string matching (case-insensitive contains) for MVP. Full-text search comes later.

# Phase 2: Real-Time Messaging
Messaging is what keeps users inside Josial instead of switching to WhatsApp. Even with polling-based delivery, the chat experience should feel responsive and familiar.
## Feature: Private Chat
**User Story: As a dog owner, I want to message my friends directly within the app so I can arrange playdates, share tips, and stay connected without needing WhatsApp.**

### User Flow: Starting a Conversation
User navigates to a friend’s profile and taps “Message”, or taps the chat icon on a friend card.
Chat screen opens. If a previous conversation exists, it loads recent messages. If new, it shows an empty state: “Say hi to [Name] and [DogName]!”
User types a message in the text input at the bottom and taps Send.
Message appears instantly in the chat (optimistic UI) with a pending indicator (single gray checkmark).
Once the server confirms delivery, the indicator changes to delivered (double gray checkmarks).
When the recipient reads the message (polls and the chat is open), the indicator changes to read (double blue checkmarks).

### Polling Architecture

Active chat screen: poll every 3 seconds for new messages in the current conversation.
Conversation list screen: poll every 5 seconds for new message counts / last message preview.
Background (app open, not on chat): poll every 15 seconds for unread message badges.
App in background: rely on push notifications only (no polling).
Optimization: include a lastMessageId parameter in the poll request. Server only returns messages newer than this ID, minimizing payload.

### Message Types (MVP)
Text messages: plain text, max 2000 characters.
Image messages: photo from camera or gallery. Compressed before upload (max 1MB for MVP). Displayed as a thumbnail in chat, tappable to view full-size.
Location share: a tappable card showing a mini-map preview with the shared coordinates. Opens in the device’s default maps app when tapped.

### Conversation List
Accessible from the Messages tab (bottom navigation).
Shows all conversations sorted by most recent message.
Each item shows: friend avatar, friend name, last message preview (truncated), timestamp, and unread count badge.
Swipe left to delete a conversation (with confirmation).
Unread conversations appear with bold text and a blue dot.

### Push Notifications
New message notification: “[Name]: [message preview]”. Tapping opens the specific conversation.
Use Firebase Cloud Messaging (FCM) for both iOS and Android.
Notifications are suppressed when the user is actively viewing the relevant chat.
Badge count on the app icon reflects total unread messages.

### Data Model: Messages

### API Endpoints: Messaging

# Phase 3: Dog Park Discovery (Post-MVP)
This phase adds the location layer that makes Josial uniquely valuable compared to Facebook groups. It requires map integration, which is the main source of technical complexity.
## Feature Overview
Interactive map with park markers (Google Maps SDK or Mapbox for React Native).
Park detail screens with photos, amenities, ratings, and reviews.
Check-in system: “I’m at this park right now” with auto-expiry (e.g., 2 hours).
“Who’s here”: see which friends are currently checked in at a park.
Favorite parks: save parks for quick access.
Park search with filters: fenced, water fountain, shade, size, distance.
Navigation: open directions in Google Maps / Waze / Apple Maps.

### Technical Approach
Park data: pre-populated database of dog parks in Israel. Start with major cities (Tel Aviv, Jerusalem, Haifa) and expand. Users can suggest new parks.
Map library: react-native-maps with Google Maps provider. Cluster markers at low zoom levels.
Check-in: creates a time-bounded record (userId, parkId, timestamp, expiresAt). Expired check-ins are filtered out on read.
Ratings: simple 1–5 star rating with optional text review. One rating per user per park (can update).


# Phase 4: Dog Walker Marketplace (Post-MVP)
The revenue engine. This feature connects dog owners with professional dog walkers and trainers. It comes after the community is established because walkers need an audience, and owners need to trust the platform.
## Feature Overview
Walker profile: separate profile type with bio, experience, certifications, service areas (drawn on map), availability calendar, and hourly rate.
Service request flow: owner creates a walk request (date, time, duration, special instructions) and the system matches nearby available walkers.
Request lifecycle: open → matched → confirmed → in progress → completed. Both parties can cancel with appropriate rules.
In-walk tracking: live location sharing during the walk so the owner can see where their dog is.
Reviews: both parties rate each other after completion.
Payments: commission-based model (Josial takes 15–20% of transaction). Integration with Stripe or local Israeli payment provider.


# App Navigation & Information Architecture
The bottom tab bar is the backbone of the app’s navigation. Every major feature is accessible within one or two taps from any screen.

## Bottom Tab Bar (MVP)

### Post-MVP Navigation Additions
Phase 3 adds a Map tab (or replaces Home if the social feed is underused).
Phase 4 adds a Services tab or integrates walker search into the Discover tab.
Notification bell icon in the top-right header across all screens, with unread badge.

# Notifications System
Notifications drive engagement and retention. The system has two layers: push notifications (Firebase) for when the app is closed, and in-app notifications for when the user is actively using the app.
## Notification Types (MVP)

# Settings & Privacy
## Settings Screen Structure
Account: edit name, email, password.
Profile: edit bio, photo, location.
Dogs: manage dog profiles (add, edit, remove).
Privacy: toggle discoverability, manage blocked users list.
Notifications: toggle push notifications per category (messages, friend requests, etc.).
Discovery: adjust radius, toggle visibility.
About: app version, terms of service, privacy policy, contact support.
Logout: clear session, return to welcome screen.
Delete Account: confirmation dialog, then delete all user data (GDPR compliance).

# Complete API Reference (MVP)
All endpoints require JWT authentication via Authorization: Bearer {token} header, except for auth endpoints.

## Authentication

## Users & Profiles

## Dogs

## Friends

## Messaging

## Notifications

# Technology Stack


# Immediate Next Steps
With this plan defined, here’s the recommended order of execution to start building Phase 0:

Project Setup: Initialize React Native project, set up folder structure, install core dependencies (React Navigation, AsyncStorage, Axios).
Backend Skeleton: Create Express server with in-memory store, JWT middleware, and the auth endpoints (register, login).
Welcome & Auth Screens: Build the welcome screen, registration form, and login form with validation and error handling.
Onboarding Wizard: Build the 3-step wizard (profile, dog, discovery preferences) with the swipe/step UI.
User Profile Screen: Build the profile view and edit screen, including dog display.
Neighbor Discovery: Build the Discover tab with the radius-based user list and friend request buttons.
Friend System: Implement friend requests, acceptance, and the friends list.
Chat: Build the conversation list and chat screen with polling-based message delivery.


|  |
| --- |


### MVP Strategy: Social-First

> The MVP focuses on building the social core: authentication, user and dog profiles, neighbor discovery (radius-based), friend connections, and polling-based real-time chat. Dog parks, location sharing, and the walker marketplace come in later phases once the community is established.


| Decision | Choice & Rationale |
| --- | --- |
| MVP Scope | Auth + Profiles + Social + Chat (no maps in v1) |
| Neighbor Discovery | Radius-based (default 2km) — flexible, works with low user density |
| Dog Profiles | Lightweight initially (name, breed, photo) — expand to full profile later |
| Real-Time Chat | Polling-based (3-5 sec interval) — simple, upgrade to WebSockets later |
| Walker Marketplace | Phase 2 — after community is established and has critical mass |
| Backend Approach | Speed-first: in-memory storage, simple JWT, minimal security, easy debugging |
| Platform | React Native (iOS + Android), English-only, Israel market |


| Phase | Features | Goal | Est. Timeline |
| --- | --- | --- | --- |
| Phase 0: Foundation | Auth, Onboarding, User Profile, Dog Profile (lightweight) | Users can sign up, create profiles, and set up their dogs | Weeks 1–3 |
| Phase 1: Social Core | Neighbor discovery, friend requests, friends list, user search, social feed | Users can find nearby dog owners and build connections | Weeks 3–5 |
| Phase 2: Messaging | Polling-based chat, conversation list, image sharing, push notifications | Users stay inside the app instead of moving to WhatsApp | Weeks 5–7 |
| Phase 3: Location | Dog park map, check-ins, park details, ratings, favorite parks | Josial becomes uniquely valuable vs. Facebook groups | Weeks 7–10 |
| Phase 4: Marketplace | Walker profiles, service areas, booking, reviews, payments | Revenue generation through commission-based transactions | Weeks 10–14+ |


| Entity | Field | Type | Notes |
| --- | --- | --- | --- |
| User | id | UUID | Auto-generated |
|  | name | String | Full name, min 2 chars |
|  | email | String | Unique, lowercase |
|  | passwordHash | String | bcrypt hash |
|  | bio | String | Max 200 chars, optional |
|  | avatar | String (base64) | Profile photo |
|  | location | { lat, lng, city } | For neighbor discovery |
|  | discoveryRadius | Number (km) | Default: 2 |
|  | isDiscoverable | Boolean | Default: true |
| Dog | id | UUID | Auto-generated |
|  | ownerId | UUID (FK) | References User.id |
|  | name | String | Required |
|  | breed | String | From breed list |
|  | photo | String (base64) | Optional |
|  | gender | Enum (M/F) | Male or Female |
|  | age | String | puppy/adult/senior or DOB |
|  | isNeutered | Boolean | Spayed/Neutered status |


| Technical Note: Scaling Discovery
The Haversine distance calculation on every user works fine for the MVP with < 10,000 users. When scaling, switch to geospatial indexing (PostGIS) or geohash-based partitioning. For now, keep it simple. |
### Friend Connection State Machine

| State | User A Sees | User B Sees | Actions Available |
| --- | --- | --- | --- |
| No Connection | Add Friend button | Add Friend button | Either can send request |
| A Requested B | Request Sent | Accept / Decline | A can cancel; B can accept/decline |
| Friends | Message / Unfriend | Message / Unfriend | Chat, view profile, unfriend |
| Blocked | (User B hidden) | (User A hidden) | Blocker can unblock |


### Friend Request Data Model

| Entity | Field | Type | Notes |
| --- | --- | --- | --- |
| FriendRequest | id | UUID | Auto-generated |
|  | fromUserId | UUID (FK) | User who sent request |
|  | toUserId | UUID (FK) | User who received request |
|  | status | Enum | pending / accepted / declined / cancelled |
|  | createdAt | Timestamp | When request was sent |
| BlockedUser | blockerId | UUID (FK) | User who blocked |
|  | blockedId | UUID (FK) | User who was blocked |


### Why Polling for MVP?

> Socket.io adds significant complexity: connection management, reconnection logic, and server infrastructure. Polling with a 3-second interval provides a near-real-time feel that’s good enough for early users, and the upgrade path to WebSockets is clean.


| Entity | Field | Type | Notes |
| --- | --- | --- | --- |
| Conversation | id | UUID | Auto-generated |
|  | participants | [UUID, UUID] | Always 2 users (1:1 chat) |
|  | lastMessage | Message object | Denormalized for list performance |
|  | updatedAt | Timestamp | For sort order |
| Message | id | UUID | Auto-generated |
|  | conversationId | UUID (FK) | References Conversation |
|  | senderId | UUID (FK) | Who sent it |
|  | type | Enum | text / image / location |
|  | content | String / Object | Text content or image URL or { lat, lng } |
|  | status | Enum | sent / delivered / read |
|  | createdAt | Timestamp | Message timestamp |


| Endpoint | Method | Description |
| --- | --- | --- |
| /api/conversations | GET | List user’s conversations |
| /api/conversations/:id/messages | GET | Get messages (with ?after=lastId) |
| /api/conversations/:id/messages | POST | Send a new message |
| /api/conversations/:id/read | PUT | Mark messages as read |
| /api/messages/unread-count | GET | Get total unread count for badge |


### Why Phase 3?

> Maps add significant complexity (native modules, permissions, performance tuning). By the time we build this, the social core will be solid and we’ll have real users providing feedback on what park features matter most.


### Revenue Model

> Commission on every transaction (target: 15–20%). Initially, transactions happen off-platform (cash/Bit). Payment integration is a dedicated sub-phase once transaction volume justifies the development investment.


| Tab | Icon | Primary Screen | Key Actions |
| --- | --- | --- | --- |
| Home | House icon | Social feed / activity overview | See recent activity, friend updates |
| Discover | Compass icon | Neighbor discovery list | Find nearby dog owners, send requests |
| Messages | Chat bubble | Conversation list | Open chats, unread badge count |
| Profile | Person icon | My profile + dogs + settings | Edit profile, view friends, settings |


| Event | Push Notification | In-App |
| --- | --- | --- |
| New friend request | [Name] wants to connect! | Badge on Profile tab + notification list |
| Request accepted | [Name] accepted your request! | Toast notification + notification list |
| New message | [Name]: [preview] | Badge on Messages tab + conversation |


| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/auth/register | Create new account. Body: { name, email, password } |
| POST | /api/auth/login | Log in. Body: { email, password } |
| POST | /api/auth/forgot-password | Request password reset code |
| POST | /api/auth/reset-password | Reset password with code |


| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/users/me | Get current user profile |
| PUT | /api/users/profile | Update profile (bio, avatar, location) |
| PUT | /api/users/preferences | Update discovery radius, visibility |
| GET | /api/users/:id | View another user’s public profile |
| GET | /api/users/discover | Discover nearby users (query: lat, lng, radius, page) |
| GET | /api/users/search | Search users by name, dog name, breed |
| DELETE | /api/users/me | Delete account and all data |


| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/dogs | Add a new dog profile |
| GET | /api/dogs | List current user’s dogs |
| PUT | /api/dogs/:id | Update a dog profile |
| DELETE | /api/dogs/:id | Remove a dog profile |


| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/friends/request | Send friend request. Body: { toUserId } |
| GET | /api/friends/requests | List pending incoming requests |
| PUT | /api/friends/requests/:id/accept | Accept a friend request |
| PUT | /api/friends/requests/:id/decline | Decline a friend request |
| DELETE | /api/friends/requests/:id | Cancel outgoing request |
| GET | /api/friends | List all accepted friends |
| DELETE | /api/friends/:userId | Unfriend a user |
| POST | /api/users/:id/block | Block a user |
| DELETE | /api/users/:id/block | Unblock a user |


| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/conversations | List all conversations with last message |
| POST | /api/conversations | Start new conversation. Body: { participantId } |
| GET | /api/conversations/:id/messages | Get messages (query: after, limit) |
| POST | /api/conversations/:id/messages | Send message. Body: { type, content } |
| PUT | /api/conversations/:id/read | Mark conversation as read |
| GET | /api/messages/unread-count | Total unread message count |


| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/notifications | List in-app notifications |
| PUT | /api/notifications/:id/read | Mark notification as read |
| PUT | /api/notifications/preferences | Update notification preferences |


| Layer | Technology | Notes |
| --- | --- | --- |
| Mobile App | React Native (Expo or bare) | iOS + Android from single codebase |
| Navigation | React Navigation v6+ | Bottom tabs + stack navigators |
| State Management | React Context + useReducer | Simple, no Redux overhead for MVP |
| Backend | Node.js + Express | Fast setup, JS everywhere |
| Data Storage (MVP) | In-memory (JS Maps/Objects) | Fast iteration, easy debugging |
| Data Storage (Future) | PostgreSQL + PostGIS | Geospatial queries, persistence |
| Authentication | JWT (jsonwebtoken package) | Simple token-based auth |
| Push Notifications | Firebase Cloud Messaging | FCM for both iOS and Android |
| Image Storage (MVP) | Base64 in-memory | Move to Cloudinary/S3 later |
| Maps (Phase 3) | react-native-maps + Google Maps | Park discovery, check-ins |


### Build Philosophy Reminder

> Keep it simple. Keep it fast. Keep it debuggable. Every decision should optimize for shipping speed and ease of visual QA. Complexity and robustness come later when we have real users and real feedback. Ship the social core, validate the concept, then iterate.
