# Quick Setup Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm start
   ```

3. **Run on device:**
   - Install Expo Go app on your phone
   - Scan the QR code from terminal
   - Or press `a` for Android emulator / `i` for iOS simulator

## Building APK with EAS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Download APK:**
   - Check build status: `eas build:list`
   - Download from Expo dashboard or use the provided URL

## Notes

- Supabase is already configured
- Database tables are set up
- Storage bucket is ready
- Just install dependencies and start coding!


