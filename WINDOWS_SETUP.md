# Windows & Android Setup Guide (Campus Safety App)

This guide explains how to run the project on a Windows machine using an Android Emulator.

## Prerequisites

1.  **Node.js**: Install the latest LTS version from [nodejs.org](https://nodejs.org/).
2.  **Git**: Install Git for Windows from [git-scm.com](https://git-scm.com/).
3.  **Android Studio**: Install from [developer.android.com](https://developer.android.com/studio).

## Step 1: Configure Android Environment

1.  **Install Android SDK**:
    *   Open Android Studio.
    *   Go to **More Actions** > **SDK Manager**.
    *   In **SDK Platforms**, ensure **Android 14 (API 34)** or **Android 13 (API 33)** is checked and installed.
    *   In **SDK Tools**, check **Android SDK Build-Tools**, **Android SDK Command-line Tools**, **Android Emulator**, and **Android SDK Platform-Tools**.

2.  **Set Environment Variables**:
    *   Search for "Edit the system environment variables" in Windows Search.
    *   Click **Environment Variables**.
    *   Under **User variables**, create a new variable:
        *   **Name**: `ANDROID_HOME`
        *   **Value**: `%LOCALAPPDATA%\Android\Sdk` (Default path. Verify this folder exists).
    *   Edit the `Path` variable and add:
        *   `%ANDROID_HOME%\platform-tools`
        *   `%ANDROID_HOME%\emulator`
        *   `%ANDROID_HOME%\tools`
        *   `%ANDROID_HOME%\tools\bin`

3.  **Create an Emulator**:
    *   Open Android Studio -> **Virtual Device Manager**.
    *   Click **Create device**.
    *   Select a device (e.g., **Pixel 6**).
    *   Select a system image (e.g., **API 34**).
    *   Finish and **Play** (Start) the emulator.

## Step 2: Set Project Up

1.  **Clone the Repository**:
    Open PowerShell or Command Prompt and run:
    ```bash
    git clone <repository-url>
    cd campus-safety-app
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Step 3: Run the App

1.  **Start the Android Build**:
    Make sure your Android Emulator is running.
    ```bash
    npm run android
    ```
    *This command matches `expo run:android` in your `package.json`. It will build the native app and install it on the emulator.*

2.  **Troubleshooting**:
    *   If you see "JAVA_HOME is not set", install **OpenJDK 17** (e.g., via Chocolatey `choco install openjdk17`) and set the `JAVA_HOME` environment variable.
    *   If the build fails, try deleting the `android` folder and regenerating it:
        ```bash
        rm -rf android
        npx expo prebuild
        npm run android
        ```

## Optional: Expo Go
If you do not want to build the native app, you can use Expo Go (faster setup):
1.  Run `npx expo start`.
2.  Press `a` in the terminal to open in Android Emulator (Expo Go app must be installed on emulator).
