# Smart Campus Health and Safety Notification Application

## Project Summary
This application enables campus users to report and track incidents in real time, view them on a map, follow status updates, and receive emergency alerts. Administrators manage notification status, edit descriptions, and send urgent announcements.

## Team Members and Contributions
- Member 1: [name], [responsibilities]
- Member 2: [name], [responsibilities]
- Member 3 (if any): [name], [responsibilities]

## Screenshots (Insert Real Images)
- Login screen: docs/screenshots/login.png
- Registration screen: docs/screenshots/register.png
- Home feed: docs/screenshots/home.png
- Map screen: docs/screenshots/map.png
- Notification detail: docs/screenshots/detail.png
- Create notification: docs/screenshots/create.png
- Admin panel: docs/screenshots/admin.png
- Profile/settings: docs/screenshots/profile.png

## Technologies Used
- Expo Router (Tabs + Stack navigation)
- React Native + TypeScript
- Firebase Auth, Firestore, Storage
- Expo Location, Expo Image Picker
- React Native Maps

## Data Model (Summary)
- users/{uid}: uid, email, fullName, firstName, lastName, department, role, photoURL, createdAt
- notifications/{id}: type, title, description, location, status, createdBy, createdByName, createdByDepartment, createdAt, updatedAt, photoUrl, followedBy
- emergency_alerts/{id}: title, message, createdAt, createdBy

## Test Summary
- Login/Register/Password reset flows verified.
- Create notification with/without photo verified.
- Status update alerts verified for followed notifications.
- Admin panel actions verified.
- Map pins and detail navigation verified.

## Git Usage
- Regular commits with incremental progress.
- Repo includes full history demonstrating development stages.

## Submission Notes
- Export this document to PDF for final submission.
- Include the project ZIP (exclude node_modules) and screenshots.
