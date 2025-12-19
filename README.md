# Campus Safety App (Atatürk University)

A comprehensive mobile safety application designed for Atatürk University students and staff. This app enables real-time incident reporting, emergency alerts, and efficient communication between the campus community and safety officials.

## 🚀 Features

### for Users
- **Emergency Alerts:** Receive critical campus-wide announcements instantly.
- **Incident Reporting:** View and follow safety notifications and incidents.
- **User Profiles:** Manage your profile, update your photo, and set department information.
- **Notification Preferences:** Customize how you want to be notified (Push, Email, Emergency Alerts).
- **Secure Authentication:** Sign up and login securely using email and password.

### for Admins
- **Admin Panel:** Specialized dashboard for safety officials.
- **Broadcast Alerts:** Issue emergency alerts to all users.
- **Manage Incidents:** Review, update status, and resolve reported incidents.

## 🛠 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **Backend:** [Firebase](https://firebase.google.com/)
  - **Authentication:** User management
  - **Firestore:** Real-time database for profiles, alerts, and notifications
  - **Storage:** Profile image hosting
- **Icons:** [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

## 🎨 Branding

The app follows the Atatürk University visual identity:
- **Primary Color:** Navy Blue (`#1C1C4E`)
- **Accent Color:** Gold (`#D4AF37`)

## 🏁 Getting Started

### Prerequisites
- Node.js installed
- A Firebase project set up with Auth, Firestore, and Storage enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yildizramazan/campus-safety-app.git
   cd campus-safety-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the application**
   ```bash
   npx expo start
   ```

5. **Run on Device/Emulator**
   - Press `i` to open in iOS Simulator.
   - Press `a` to open in Android Emulator.
   - Scan the QR code with the Expo Go app on your physical device.

## 📱 Screenshots

_(Add screenshots of Login, Home, and Profile screens here)_

## 📄 License

This project is proprietary software for Atatürk University Campus Safety.
