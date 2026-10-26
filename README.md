# INFYUM DESIGN — Premium Image Tools Web Application

**INFYUM DESIGN** is an enterprise-grade, premium SaaS web application designed for Infyum employees. It combines modern aesthetics, role-based Google & email/password authentication, database-backed access permissions, audit logging, and three high-performance image processing tools.

---

## 🌟 Key Features

### 1. Premium UI/UX Design
- **Color Palette:** Pure white, deep red (`#991b1b` / `#b91c1c` / `#7f1d1d`), and slate neutrals.
- **Micro-interactions:** Smooth animations, loading spinners, progress bars, and celebration confetti.
- **Responsive Layout:** Tailored for ultra-wide desktops, laptops, tablets, and smartphones.
- **Subtle Branding:** Includes required subtle footer `Developed by JAY AHIR INFYUM` across all screens.

### 2. Strict Authentication & Role-Based Authorization
- **Employee Sign-In:** 
  - Employees authenticate using their existing **Google accounts** (`signInWithPopup`).
  - Google login verifies identity, while application access is governed by Firestore database approval.
  - New employees default to `status: 'pending'` and are directed to the **Pending Admin Approval** screen.
  - Disabled employees are strictly barred with the **Account Access Disabled** screen.
  - Employees can **NEVER** escalate privileges or access the Admin Panel.
- **Admin Sign-In:**
  - Dedicated Admin Login portal accessible via `/admin` or the Admin Portal button.
  - **The only authorized Admin email is `infyumtech@gmail.com`**.
  - Admin signs in using Email & Password.
  - Server-side role checks prevent unauthorized access even if direct URLs are requested.

### 3. Admin Panel
- **Dashboard Overview:**
  - Total registered employees
  - Currently active employees
  - Approved accounts
  - Pending requests requiring approval
  - Disabled accounts
- **Employee Access Management:**
  - Search by employee name or email.
  - Filter tabs: All, Pending, Approved, Disabled.
  - Approve or reject employee registration requests with one click.
  - Granular toggle to grant or revoke Image Tools access (`canUseTools`).
  - Deactivate/enable employee accounts with confirmation modals.
  - Last login timestamp tracking and deletion of employee records.
- **Audit Ledger:**
  - Full audit trail (`access_audit_logs`) recording who changed what, timestamp, target employee, and action.
  - User session activity logging (`login_activity`).

### 4. Exactly Three Image Tools (Employee Dashboard)
1. **Tool 1: JPG to PNG Converter**
   - Drag-and-drop or file selector for JPG/JPEG images.
   - Original image preview with dimensions and file size.
   - Client-side Canvas rendering preserving 100% dimensions and pixel quality.
   - Generates genuine PNG blobs with automatic `.png` filename.
   - Download PNG button and Reset option.
2. **Tool 2: PNG to JPG Converter**
   - Upload PNG images.
   - Background color picker for transparent areas (default `#FFFFFF` white, plus presets: White, Black, Off-White, Neutral Gray, and custom hex color).
   - Adjustable JPEG quality slider (10% to 100%).
   - Preserves original dimensions with compression savings badge.
   - Download JPG button (`.jpg`) and Reset option.
3. **Tool 3: AI Background Remover**
   - Genuine Machine Learning neural segmentation (using WebAssembly ONNX runtime directly in-browser).
   - 100% private, free, and runs on client device without sending private data to external servers.
   - Transparent areas displayed with standard checkered grid.
   - Interactive Split Slider or Side-by-Side comparison mode.
   - Working Download Transparent PNG button (`[filename]_no_bg.png`).
   - Optional Remove.bg API key configuration modal if cloud API processing is desired.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node v24)
- npm 9+

### Installation & Local Run
```bash
# Clone or navigate to the repository
cd vagh

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

### Admin Password Management
The Admin user `infyumtech@gmail.com` is configured in Firebase Authentication and Cloud Firestore.
To update or change the Admin password at any time via the trusted administrative CLI script:
```bash
npm run set-admin-password "<your-new-secure-password>"
```
Example:
```bash
npm run set-admin-password "InfyumAdmin2026!"
```

To run all automated security and live authentication tests:
```bash
node src/test/liveAdminAuthTest.mjs
node src/test/serviceTest.mjs
```
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```
3. Deploy the included Firestore Security Rules:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 🛡️ Database Architecture & Security Rules

### Collections
- `admin_users/{uid}`: Admin identity records (`infyumtech@gmail.com`).
- `employee_users/{uid}`: Employee directory records (`uid`, `name`, `email`, `photoURL`, `status`, `isApproved`, `canUseTools`, `createdAt`, `lastLoginAt`).
- `login_activity/{id}`: Audit log of employee and admin logins/logouts.
- `access_audit_logs/{id}`: Administrative ledger of approvals, revocations, and status changes.

### Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() { return isAuthenticated() && request.auth.token.email == 'infyumtech@gmail.com'; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    // Admin collection: Exclusive access
    match /admin_users/{userId} {
      allow read, write: if isAdmin();
    }

    // Employee collection
    match /employee_users/{userId} {
      allow get: if isOwner(userId) || isAdmin();
      allow list: if isAdmin();
      allow create: if isOwner(userId) && request.resource.data.isApproved == false && request.resource.data.status == 'pending';
      allow update: if isAdmin() || (isOwner(userId) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastLoginAt', 'photoURL', 'name']));
      allow delete: if isAdmin();
    }

    match /login_activity/{logId} {
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if false;
    }

    match /access_audit_logs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 🎨 Figma-Like Design Studio & Complete Keyboard Shortcut System

The INFYUM Design Studio is a complete, browser-based professional design application featuring a centralized, customizable keyboard shortcut engine, infinite zoomable canvas, Auto Layout frames, master components, interactive prototyping, and multi-format vector & bitmap exports.

### 1. Complete Keyboard Shortcuts Reference

Shortcuts are editor-aware, cross-platform (`Ctrl` on Windows/Linux, `Cmd` on macOS), and automatically disengaged while typing in text inputs or editing text.

| Action | Category | Windows / Linux | macOS | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Move / Select Tool** | Tools | `V` | `V` | Switch to selection tool |
| **Frame Tool** | Tools | `F` | `F` | Create responsive layout frames |
| **Rectangle Tool** | Tools | `R` | `R` | Draw rectangle/square on canvas |
| **Ellipse Tool** | Tools | `O` | `O` | Draw ellipse or circle |
| **Line Tool** | Tools | `L` | `L` | Draw straight divider lines |
| **Text Tool** | Tools | `T` | `T` | Place editable typography layer |
| **Pen Tool** | Tools | `P` | `P` | Freehand drawing / vector strokes |
| **Scale Tool** | Tools | `K` | `K` | Proportional resize & scale |
| **Eyedropper** | Tools | `I` | `I` | Sample canvas color |
| **Hand / Pan Tool** | Tools | `H` or `Space + Drag` | `H` or `Space + Drag` | Pan canvas viewport |
| **Add Auto Layout** | Auto Layout | `Shift + A` | `Shift + A` | Wrap selection in Auto Layout container |
| **Create Section** | Tools | `Shift + S` | `Shift + S` | Create section frame |
| **Exit Tool / Deselect** | Tools | `Escape` | `Escape` | Clear selection / Return to Select tool |
| **Copy** | Clipboard | `Ctrl + C` | `Cmd + C` | Copy objects to clipboard |
| **Cut** | Clipboard | `Ctrl + X` | `Cmd + X` | Cut selected objects |
| **Paste** | Clipboard | `Ctrl + V` | `Cmd + V` | Paste copied objects |
| **Paste in Place** | Clipboard | `Ctrl + Shift + V` | `Cmd + Shift + V` | Paste in original coordinates |
| **Duplicate** | Clipboard | `Ctrl + D` | `Cmd + D` | Clone selected objects with offset |
| **Alt + Drag Duplicate** | Canvas | `Alt + Drag` | `Option + Drag` | Duplicate selection by dragging |
| **Undo** | History | `Ctrl + Z` | `Cmd + Z` | Revert previous canvas action |
| **Redo** | History | `Ctrl + Shift + Z` / `Ctrl + Y` | `Cmd + Shift + Z` | Reapply undone operation |
| **Save Project** | Project | `Ctrl + S` | `Cmd + S` | Save design immediately |
| **Delete** | Editing | `Delete` / `Backspace` | `Delete` / `Backspace` | Delete selected objects |
| **Select All** | Selection | `Ctrl + A` | `Cmd + A` | Select all objects on active canvas |
| **Deselect All** | Selection | `Ctrl + Shift + A` | `Cmd + Shift + A` | Clear multi-selection |
| **Group Selection** | Grouping | `Ctrl + G` | `Cmd + G` | Group selected objects |
| **Ungroup Selection** | Grouping | `Ctrl + Shift + G` | `Cmd + Shift + G` | Disband selected group |
| **Frame Selection** | Grouping | `Ctrl + Alt + G` | `Cmd + Alt + G` | Wrap objects in a frame |
| **Create Component** | Components | `Ctrl + Alt + K` | `Cmd + Alt + K` | Turn selection into master component |
| **Detach Instance** | Components | `Ctrl + Alt + B` | `Cmd + Alt + B` | Detach component instance |
| **Zoom In** | Navigation | `+` or `=` | `+` or `=` | Zoom in 10% |
| **Zoom Out** | Navigation | `-` | `-` | Zoom out 10% |
| **Zoom to Fit** | Navigation | `Shift + 1` or `Home` | `Shift + 1` or `Home` | Center and fit all artwork in viewport |
| **Zoom to Selection** | Navigation | `Shift + 2` | `Shift + 2` | Center and zoom in on selected objects |
| **Zoom 100%** | Navigation | `Shift + 0` or `1` | `Shift + 0` or `1` | Reset zoom to 1:1 pixel scale |
| **Bring Forward** | Layer Order | `Ctrl + ]` | `Cmd + ]` | Move layer up one step |
| **Send Backward** | Layer Order | `Ctrl + [` | `Cmd + [` | Move layer down one step |
| **Bring to Front** | Layer Order | `Ctrl + Shift + ]` | `Cmd + Shift + ]` | Move layer to top of stack |
| **Send to Back** | Layer Order | `Ctrl + Shift + [` | `Cmd + Shift + [` | Move layer to bottom of stack |
| **Align Left** | Alignment | `Alt + A` | `Alt + A` | Align objects to left edge |
| **Align Center H** | Alignment | `Alt + H` | `Alt + H` | Align objects to horizontal center |
| **Align Right** | Alignment | `Alt + D` | `Alt + D` | Align objects to right edge |
| **Align Top** | Alignment | `Alt + W` | `Alt + W` | Align objects to top edge |
| **Align Center V** | Alignment | `Alt + V` | `Alt + V` | Align objects to vertical center |
| **Align Bottom** | Alignment | `Alt + S` | `Alt + S` | Align objects to bottom edge |
| **Bold Text** | Typography | `Ctrl + B` | `Cmd + B` | Toggle bold font weight |
| **Italic Text** | Typography | `Ctrl + I` | `Cmd + I` | Toggle italic font style |
| **Underline Text** | Typography | `Ctrl + U` | `Cmd + U` | Toggle underline style |
| **Increase Font Size**| Typography | `Ctrl + Shift + >` | `Cmd + Shift + >` | Increase font size by 2px |
| **Decrease Font Size**| Typography | `Ctrl + Shift + <` | `Cmd + Shift + <` | Decrease font size by 2px |
| **New Slide / Page** | Layers | `Ctrl + Shift + N` | `Cmd + Shift + N` | Add a new carousel slide |
| **Duplicate Layer** | Layers | `Ctrl + J` | `Cmd + J` | Duplicate selected layer |
| **Present Prototype** | Prototype | `Ctrl + Alt + P` / `Shift + P` | `Cmd + Alt + P` / `Shift + P` | Open interactive device preview |
| **Shortcuts Reference**| Help | `Ctrl + /` or `?` | `Cmd + /` or `?` | Open Searchable Shortcuts Modal |
| **Nudge Object** | Transform | Arrow Keys | Arrow Keys | Move 1px (or 10px with `Shift`) |

---

## 🛠️ Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Custom Deep Red palette + glassmorphism)
- **State Management:** Zustand (Customizable Shortcut Registry + LocalStorage Persistence)
- **Icons:** Lucide React
- **Authentication:** Firebase Auth (Google Sign-In + Admin Email/Password)
- **Database:** Google Cloud Firestore
- **Vector & PDF Export:** Pure JS SVG Generator + PDF 1.4 Binary Generator
- **Image Processing:** HTML5 2D Canvas + WebAssembly neural network (`@imgly/background-removal`)
- **FX:** Canvas Confetti

---

## 📄 Footer
`Developed by JAY AHIR INFYUM`
