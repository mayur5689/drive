# Google Drive Integration Guide

This document outlines the rules and setup requirements for the Google Drive integration in Aneerequest.

## 1. Authentication & Permissions
The system uses **OAuth2** with a Service Account or a Refresh Token.
- **Gmail Account:** The account associated with the `GOOGLE_OAUTH_REFRESH_TOKEN` is the "Storage Owner".
- **Folder Access:** Any folder you link (Root or Client-specific) **MUST** be shared with this Gmail account with **Editor** permissions.
- **Rules:**
  - If you paste a URL/ID and it says "Access Denied", ensure the folder is shared with the system's Gmail account.
  - The system can create subfolders but cannot "guess" folders it hasn't been given access to.

## 2. Root Folder Management
Located in **Account Settings** (Super Admin only).
- **Default Behavior:** If no root folder is set, it falls back to the `GOOGLE_DRIVE_ROOT_FOLDER_ID` in your `.env` file.
- **Changing Root:** When you update the root folder:
  - New clients/requests will be created in the **new** root.
  - Old clients stay in their existing folders unless you manually move them or update their individual links.

## 3. Individual Client Folders
Located in **Client Detail** -> **Folder** tab.
- **Override:** Linking a folder here bypasses the Global Root for this specific client.
- **Automation:** Files uploaded via request chats for this client will automatically go into `[Linked Folder] > [Request Title] > Production/Distributed`.
- **Validation:** Always use the "Validate & Link" button to ensure the connection is live.

## 4. File & Folder Operations (CRUD)
- **Files Sidebar:** 
  - Renaming a file updates the name on Drive and in the system database.
  - Deleting a file removes the attachment from the message and moves the Drive file to Trash.
- **Client Folder Browser:**
  - Full CRUD is available. You can create subfolders, upload files directly, rename, and delete.
  - **Caution:** Deleting a folder on Drive via the browser will move it to Trash. If that folder was a "Request" folder, the system might not find it again until a new file is uploaded.

## 5. Troubleshooting
- **File not appearing?** Refresh the page. The system syncs with Drive on every load.
- **Upload failed?** Check if the Drive storage is full or if the folder permissions have changed.
