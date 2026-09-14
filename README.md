# Sashrika Real Estate — System Documentation

A comprehensive, production-grade technical manual detailing the architecture, technology stack, directory structures, environment configurations, local development workflow, production deployment guides, security model, and core operational workflows for the **Sashrika Real Estate** platform.

---

## Table of Contents

1. [Executive Summary & Architecture Overview](#1-executive-summary--architecture-overview)
   - [High-Level Architecture Diagram](#high-level-architecture-diagram)
   - [System Component Separation](#system-component-separation)
2. [Technology Stack & Key Libraries](#2-technology-stack--key-libraries)
   - [Frontend Ecosystem](#frontend-ecosystem)
   - [Backend Ecosystem](#backend-ecosystem)
   - [Database & Storage](#database--storage)
   - [Cloud Hosting & Infrastructure](#cloud-hosting--infrastructure)
3. [Project Structure & Module Responsibilities](#3-project-structure--module-responsibilities)
   - [Frontend Directory Structure](#frontend-directory-structure)
   - [Frontend Modules & Responsibilities](#frontend-modules--responsibilities)
   - [Backend Directory Structure](#backend-directory-structure)
   - [Backend Modules & Responsibilities](#backend-modules--responsibilities)
4. [Environment Configuration Reference](#4-environment-configuration-reference)
   - [Frontend Environment Variables](#frontend-environment-variables)
   - [Backend Environment Variables & Configuration](#backend-environment-variables--configuration)
5. [Step-by-Step Local Setup Guide](#5-step-by-step-local-setup-guide)
   - [Prerequisites](#prerequisites)
   - [Backend Local Setup](#backend-local-setup)
   - [Frontend Local Setup](#frontend-local-setup)
   - [Verifying the Local Setup](#verifying-the-local-setup)
6. [Step-by-Step Production Deployment Guide](#6-step-by-step-production-deployment-guide)
   - [Railway Setup (PostgreSQL Database & Backend API)](#railway-setup-postgresql-database--backend-api)
   - [Vercel Setup (Frontend SPA & Routing)](#vercel-setup-frontend-spa--routing)
   - [Google Cloud Console Configuration (OAuth 2.0)](#google-cloud-console-configuration-oauth-20)
   - [Cloudinary Media Storage Configuration](#cloudinary-media-storage-configuration)
7. [Authentication, Roles & Security](#7-authentication-roles--security)
   - [Authentication Architecture & Workflows](#authentication-architecture--workflows)
   - [Role-Based Access Control (RBAC) & Admin Verification](#role-based-access-control-rbac--admin-verification)
   - [Frontend Route Protection](#frontend-route-protection)
   - [Backend JWT Token Validation & CORS Policies](#backend-jwt-token-validation--cors-policies)
8. [Core Operational Workflows](#8-core-operational-workflows)
   - [Property Listing Lifecycle](#property-listing-lifecycle)
   - [Multi-Image Upload Pipeline](#multi-image-upload-pipeline)
   - [Strict Sri Lankan Phone Number Validation](#strict-sri-lankan-phone-number-validation)
   - [Search, Filter & Sorting Pipeline](#search-filter--sorting-pipeline)
   - [User Inquiry & WhatsApp Contact Flow](#user-inquiry--whatsapp-contact-flow)

---

## 1. Executive Summary & Architecture Overview

Sashrika Real Estate is a modern, high-performance web platform designed to facilitate real estate listings, browsing, direct seller communication, and administrative moderation in Sri Lanka. The application follows a decoupled, headless client-server architecture:

- **Single-Page Application (SPA) Frontend**: Built using React 19 and Vite, deployed on Vercel's Edge Network for rapid asset delivery and client-side page rendering.
- **RESTful Backend API**: Built using ASP.NET Core (.NET 10), hosted on Railway, delivering secure endpoints for property management, user authentication, media uploads, and administrative moderation.
- **Relational Persistence**: A managed PostgreSQL database provisioned on Railway storing relational models including users, properties, and moderation records.
- **Cloud Media Storage**: Cloudinary integration ensuring optimized asset delivery (WebP/AVIF auto-format, quality compression, responsive resizing) and high availability for property photo galleries.
- **Federated Authentication**: Google OAuth 2.0 integration coupled with standard JSON Web Token (JWT) issuance for streamlined user onboarding and secure session handling.

### High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client Tier (Web Browser)"]
        UserBrowser["User / Admin Browser"]
    end

    subgraph CDN["Edge & Delivery Tier (Vercel)"]
        VercelSPA["React 19 + Vite SPA\n(vercel.json SPA Rewrites)"]
    end

    subgraph CloudOAuth["Identity Provider"]
        GoogleAuth["Google Identity Services\n(OAuth 2.0 JWT)"]
    end

    subgraph Compute["Backend Tier (Railway App)"]
        BackendAPI["ASP.NET Core Web API (.NET 10)\nKestrel Server / Controllers"]
        PhotoService["PhotoService\n(CloudinaryDotNet SDK)"]
        AuthMiddleware["JWT Authentication\n& CORS Middleware"]
    end

    subgraph DataTier["Data & Storage Tier"]
        PostgresDB[("PostgreSQL Database\n(Railway Managed)")]
        CloudinaryCDN[("Cloudinary Media CDN\n(Image Storage & Transformations)")]
    end

    %% Client to CDN
    UserBrowser -->|"HTTPS / Assets"| VercelSPA

    %% Client interactions
    UserBrowser -->|"Google Sign-In Popup"| GoogleAuth
    GoogleAuth -->|"ID Token (Credential)"| UserBrowser

    %% Client to Backend
    UserBrowser -->|"REST API Requests (JWT in Bearer Header)"| AuthMiddleware
    AuthMiddleware --> BackendAPI

    %% Backend to Identity
    BackendAPI -->|"Validate Google Token"| GoogleAuth

    %% Backend to Database & Cloud
    BackendAPI -->|"Entity Framework Core (Npgsql)"| PostgresDB
    BackendAPI --> PhotoService
    PhotoService -->|"Multipart Upload"| CloudinaryCDN

    %% Media direct to client
    CloudinaryCDN -.->|"Optimized Image Delivery"| UserBrowser
```

### System Component Separation

| Component | Host / Provider | Responsibilities | Communication Protocols |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | Vercel | User interface rendering, search & filtering UI, multi-image upload orchestrator, local favorites state, auth state synchronization. | HTTPS, REST over JSON, Web Fetch API |
| **Backend API** | Railway | Authentication orchestration, property CRUD operations, moderation state management, data validation, media upload routing. | HTTPS, REST, JWT Bearer tokens |
| **Relational Database** | Railway | Relational data persistence for Users and Properties, indexing, referential integrity. | TCP / PostgreSQL Connection Pool (`Npgsql`) |
| **Media Asset Storage** | Cloudinary | Persistent image storage, automatic WebP/AVIF format conversion (`f_auto`), compression (`q_auto`), thumbnail transformations. | HTTPS REST API via CloudinaryDotNet |
| **Identity Provider** | Google Cloud | User credential issuance, user identity verification via OpenID Connect (OIDC). | HTTPS / JSON Web Signature (JWS) |

---

## 2. Technology Stack & Key Libraries

### Frontend Ecosystem

| Technology / Library | Version | Category | Purpose & Implementation |
| :--- | :--- | :--- | :--- |
| **React** | `^19.2.8` | UI Library | Core declarative component rendering engine. |
| **ReactDOM** | `^19.2.8` | DOM Renderer | DOM mounting and concurrent rendering pipeline. |
| **Vite** | `^8.2.2` | Build Tool & Dev Server | Ultra-fast HMR and optimized production bundling using Rollup. |
| **React Router DOM** | `^7.18.3` | Client-Side Routing | Declarative SPA navigation, route guards, dynamic parameters. |
| **Tailwind CSS** | `^3.4.19` | Styling Framework | Utility-first responsive CSS styling with custom theme configurations. |
| **Lucide React** | `^1.43.0` | Iconography | Modern, tree-shakeable SVG UI icons. |
| **Autoprefixer & PostCSS** | `^10.5.5` / `^8.5.28` | CSS Processing | Vendor-prefix automation and modular CSS transforms. |
| **Oxlint** | `^1.79.0` | Code Quality | High-speed JavaScript/JSX static analysis and linting. |

### Backend Ecosystem

| Technology / Library | Version | Category | Purpose & Implementation |
| :--- | :--- | :--- | :--- |
| **ASP.NET Core Web API** | `.NET 10.0` | Web Framework | High-performance, cross-platform RESTful web services. |
| **Entity Framework Core** | `10.0.11` | ORM | Object-relational mapping, LINQ queries, schema generation. |
| **Npgsql.EntityFrameworkCore.PostgreSQL** | `10.0.0` | Database Driver | PostgreSQL database provider for Entity Framework Core. |
| **Microsoft.AspNetCore.Authentication.JwtBearer** | `10.0.12` | Security | JWT Bearer token authentication and claims validation. |
| **Google.Apis.Auth** | `1.76.0` | Authentication | Cryptographic validation of Google OAuth ID tokens (`GoogleJsonWebSignature`). |
| **CloudinaryDotNet** | `1.29.3` | Cloud SDK | Programmatic multi-file upload, transformation, and asset management. |
| **Swashbuckle.AspNetCore** | `10.2.3` | API Documentation | Swagger / OpenAPI generation for interactive API inspection. |

### Database & Storage

- **Database Engine**: PostgreSQL 15+ / 16 (Hosted on Railway managed infrastructure or local development instance).
- **Object Storage**: Cloudinary (Cloud-based Digital Asset Management).
- **Local Fallback Storage**: `Backend/wwwroot/uploads` (for development environments without Cloudinary credentials).

### Cloud Hosting & Infrastructure

- **Frontend Hosting**: Vercel (Global Edge Network, automatic SSL, SPA routing rewrites via `vercel.json`).
- **Backend Hosting**: Railway (Containerized .NET 10 runtime, automatic restart, environment secret management).
- **Database Hosting**: Railway PostgreSQL (Internal private network communication via `postgres.railway.internal`).

---

## 3. Project Structure & Module Responsibilities

```
Sasrika-Real-Estate/
├── Backend/
│   ├── Controllers/
│   ├── Data/
│   ├── Dtos/
│   ├── Models/
│   ├── Properties/
│   ├── Services/
│   ├── wwwroot/
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── appsettings.Production.json
│   ├── Program.cs
│   └── RealEstate.Api.csproj
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── vite.config.js
└── SYSTEM_DOCUMENTATION.md
```

---

### Frontend Directory Structure

```
Frontend/src/
├── assets/                       # Static branding images, icons, and illustrations
├── components/                   # Modular, reusable UI components
│   ├── AddPropertyModal.jsx      # Modal form for submitting new properties with multi-image upload & phone validation
│   ├── AuthModal.jsx             # Authentication modal (Email/Password & Google Sign-In, 8-char min password)
│   ├── EditPropertyModal.jsx     # Modal for updating existing property listings with strict phone validation
│   ├── Footer.jsx                # Global site footer with links and company info
│   ├── ImageUploadField.jsx      # Multi-image drag-and-drop & batch file upload component (up to 10 images)
│   ├── Navbar.jsx                # Responsive header with navigation links, branding, and auth controls
│   ├── PinPromptModal.jsx        # Admin secret key prompt dialog
│   ├── PropertyCard.jsx          # Property preview card with image carousel, pricing, and favorite toggle
│   ├── ProtectedRoute.jsx        # Route guard verifying user authentication before rendering child routes
│   ├── SavedListingsModal.jsx    # Modal displaying properties favorited by the user
│   ├── SearchFilterBar.jsx       # Multi-criteria search bar (type, district, price range, search term)
│   └── WhatsAppIcon.jsx          # Reusable WhatsApp SVG brand icon
├── config/
│   └── api.js                    # Centralized API base URL and endpoint registry
├── context/
│   ├── AuthContext.jsx           # Global user authentication state, token storage, and auth-fetch helper
│   └── FavoritesContext.jsx      # Global property favorites state synchronized with localStorage
├── pages/
│   ├── AboutPage.jsx             # Company background, vision, team, and contact information
│   ├── AdminPage.jsx             # Administrative moderation dashboard for property approvals and system metrics
│   ├── HomePage.jsx              # Landing page featuring hero search, filter bar, and property grid
│   ├── MyListingsPage.jsx        # User-specific dashboard for managing self-submitted properties
│   └── PropertyDetailsPage.jsx   # Detailed property view with image gallery, specs, seller info, and contact CTAs
├── utils/
│   └── phoneUtils.js             # WhatsApp URL builders, Sri Lankan phone formatters
├── App.css                       # Application-specific global styles and animations
├── App.jsx                       # Root routing configuration and modal container
├── index.css                     # Tailwind CSS directives and base styles
└── main.jsx                      # React application entry point (mounts to #root)
```

#### Frontend Modules & Responsibilities

1. **`src/config/api.js`**:
   - Centralizes the Backend API configuration.
   - Reads `import.meta.env.VITE_API_BASE_URL` with fallback to `http://localhost:5143/api`.
   - Exposes standardized endpoints for `properties`, `auth`, `admin`, and `upload`.

2. **`src/context/AuthContext.jsx`**:
   - Manages user login state, JWT storage (`sasrika_token`), and user profile (`sasrika_user`) in `localStorage`.
   - Exposes authentication methods: `login()`, `register()`, `loginWithGoogle()`, and `logout()`.
   - Provides `authFetch()`: a wrapper around the native Fetch API that automatically attaches the `Authorization: Bearer <token>` header to requests and triggers an automatic logout upon receiving 401 Unauthorized.

3. **`src/components/ProtectedRoute.jsx`**:
   - Prevents unauthenticated users from accessing protected pages (e.g., `/admin`, `/my-listings`).
   - Preserves requested return URLs in `sessionStorage` (`sasrika_return_to`) and dispatches `sasrika:open-auth-modal` event to open the sign-in modal.

4. **`src/components/ImageUploadField.jsx`**:
   - Multi-file image upload handler supporting up to 10 photos simultaneously.
   - Handles Drag & Drop, client-side validation (formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`; max 15 MB per file), and displays a thumbnail preview grid with per-image deletion capabilities.

5. **`src/pages/AdminPage.jsx`**:
   - Two-tier security dashboard: requires standard authentication via `ProtectedRoute` and administrative verification via the `X-Admin-Key` header against `POST /api/admin/verify`.
   - Provides administrative controls: approve pending listings, reject listings, delete listings, and monitor platform metrics.

---

### Backend Directory Structure

```
Backend/
├── Controllers/
│   ├── AdminController.cs        # Moderation endpoints, metrics, and admin key verification
│   ├── AuthController.cs         # Registration, login, Google OAuth validation, profile endpoints
│   ├── PropertiesController.cs   # Public and authenticated CRUD operations, search, and filtering
│   └── UploadController.cs       # Multi-image upload endpoint (Cloudinary / local fallback)
├── Data/
│   └── AppDbContext.cs           # EF Core Database Context, model mappings, value converters
├── Dtos/
│   ├── AuthDtos.cs               # RegisterDto (min 8 char password, phone regex), LoginDto, etc.
│   ├── CreatePropertyDto.cs      # Creation payload with Required + Regex SellerPhone validation
│   ├── UpdatePropertyDto.cs      # Update payload with Required + Regex SellerPhone validation
│   ├── PropertyQueryParameters.cs# Filter and search parameter bindings
│   └── RejectPropertyDto.cs      # Rejection reason payload
├── Models/
│   ├── Enum.cs                   # Enumerations: PropertyType, ListingType, ModerationStatus
│   ├── Property.cs               # Property entity definition with validation attributes
│   └── User.cs                   # User entity definition with identity properties and role
├── Properties/
│   └── launchSettings.json       # Local development Kestrel server profiles
├── Services/
│   ├── CloudinarySettings.cs     # Strongly-typed configuration options for Cloudinary credentials
│   ├── IPhotoService.cs          # Interface contract for photo upload services
│   ├── PhotoService.cs           # Cloudinary image upload with optimization transformations
│   ├── IPropertyService.cs       # Interface contract for property business logic
│   └── PropertyService.cs        # Property domain service implementation
├── wwwroot/
│   └── uploads/                  # Local directory for media storage fallback
├── appsettings.json              # Base application configuration (sanitized for public repositories)
├── appsettings.Development.json  # Local development overrides and connection strings
├── appsettings.Production.json   # Production logging configuration
├── Program.cs                    # Application entry point, dependency injection, middleware pipeline
└── RealEstate.Api.csproj         # Project manifest, package references, and target framework (.NET 10)
```

---

## 4. Environment Configuration Reference

### Frontend Environment Variables

Configure these variables in `Frontend/.env` (Local) and in the **Vercel Project Settings > Environment Variables** (Production). Refer to `Frontend/.env.example` for the template.

| Variable Name | Required | Local Example | Production Placeholder Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:5143/api` | `https://your-railway-app.up.railway.app/api` | Base URL pointing to the Backend API. |
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | `your_google_client_id.apps.googleusercontent.com` | `your_google_client_id.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID used by the Google Identity Services popup. |

---

### Backend Environment Variables & Configuration

In production, Railway injects environment variables directly into the container. In local development, configure `Backend/appsettings.Development.json`.

| Variable / Key | Required | Production Value Placeholder | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://username:password@postgres.railway.internal:5432/railway` | PostgreSQL URI injected automatically by Railway. Parsed in `Program.cs` into an Npgsql connection string. |
| `ConnectionStrings__DefaultConnection` | Optional | `Host=your_db_host;Port=5432;Database=your_db;Username=your_user;Password=your_password;SSL Mode=Prefer;Trust Server Certificate=true` | Fallback connection string if `DATABASE_URL` is not defined. |
| `ASPNETCORE_ENVIRONMENT` | **Yes** | `Production` (or `Development` locally) | Sets ASP.NET Core environment mode. Controls Swagger visibility and error verbosity. |
| `JwtSettings__Secret` | **Yes** | `your_jwt_secret_key_minimum_32_characters` | Symmetric key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JwtSettings__Issuer` | **Yes** | `SashrikaRealEstate` | Expected token issuer (`iss` claim). |
| `JwtSettings__Audience` | **Yes** | `SashrikaRealEstateApp` | Expected token audience (`aud` claim). |
| `CloudinarySettings__CloudName` | **Yes** | `your_cloudinary_cloud_name` | Cloudinary account Cloud Name. |
| `CloudinarySettings__ApiKey` | **Yes** | `your_cloudinary_api_key` | Cloudinary API Key. |
| `CloudinarySettings__ApiSecret` | **Yes** | `your_cloudinary_api_secret` | Cloudinary API Secret for signed REST uploads. |
| `CloudinarySettings__Folder` | **Yes** | `sasrika/properties` | Cloudinary folder under which property images are stored. |
| `Authentication__Google__ClientId` | **Yes** | `your_google_client_id.apps.googleusercontent.com` | Google OAuth Client ID validated by backend when verifying tokens. |
| `AdminSettings__MasterKey` | **Yes** | `your_admin_master_key` | Master secret key used to verify admin access via `X-Admin-Key` header. |

---

## 5. Step-by-Step Local Setup Guide

### Prerequisites

Ensure the following tools are installed on your workstation:
- **.NET 10 SDK**: Verify using `dotnet --version`
- **Node.js (v20+ LTS) & npm**: Verify using `node -v` and `npm -v`
- **PostgreSQL (v15+)**: Running locally (or Docker container)
- **Git**: For version control

---

### Backend Local Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Configure Local Database Connection**:
   Open `appsettings.Development.json` and ensure your local PostgreSQL connection string is set:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=sashrika_dev;Username=postgres;Password=your_password;SSL Mode=Prefer;Trust Server Certificate=true"
     },
     "AdminSettings": {
       "MasterKey": "DevAdminKey123"
     },
     "JwtSettings": {
       "Secret": "DevelopmentSecretKeyForSasrikaRealEstateMustBe32CharactersOrMore!",
       "Issuer": "SashrikaRealEstate",
       "Audience": "SashrikaRealEstateApp",
       "ExpiryDays": 7
     }
   }
   ```

3. **Restore NuGet Packages & Build**:
   ```bash
   dotnet restore
   dotnet build
   ```

4. **Run the Backend API**:
   ```bash
   dotnet run
   ```
   - The API starts on `http://localhost:5143` (HTTP) and `https://localhost:7143` (HTTPS).
   - On startup, `EnsureCreated()` automatically initializes the database tables and seeds the default administrator account:
     - **Email**: `admin@sasrika.lk`
     - **Password**: `Admin@2026`
   - Access Swagger API documentation at: `http://localhost:5143/swagger`

---

### Frontend Local Setup

1. **Navigate to the Frontend directory**:
   ```bash
   cd Frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Local Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Verify `Frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5143/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

4. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   - The React application will be available at `http://localhost:5173`.

---

### Verifying the Local Setup

1. Open `http://localhost:5173` in your browser.
2. Click **Sign In** and verify that the authentication modal opens.
3. Test regular login using the seeded admin credentials (`admin@sasrika.lk` / `Admin@2026`).
4. Click **+ Add Property** to ensure the modal opens, verify phone number validation (10 digits starting with `0`), and test uploading images.
5. Visit `http://localhost:5173/admin`, enter the configured Admin Master Key, and confirm that moderation queues function.

---

## 6. Step-by-Step Production Deployment Guide

### Railway Setup (PostgreSQL Database & Backend API)

```
Railway Project Dashboard
├── Service 1: PostgreSQL Database (Plugin)
│   └── Variables: Provides DATABASE_URL automatically
└── Service 2: Sashrika Backend (ASP.NET Core Web API)
    ├── Connected to GitHub repository (Backend root)
    └── Variables: Linked DATABASE_URL, JWT, Cloudinary, and Google credentials
```

#### Step 1: Provision the PostgreSQL Database on Railway
1. Log in to [Railway](https://railway.app/).
2. Create a new project.
3. Click **+ New** > **Database** > **Add PostgreSQL**.
4. Railway will spin up a PostgreSQL instance and expose `DATABASE_URL` (e.g., `postgresql://username:password@postgres.railway.internal:5432/railway`).

#### Step 2: Deploy the Backend Service
1. Click **+ New** > **GitHub Repo** and select the repository.
2. In the deployment settings:
   - **Root Directory**: Set to `/Backend`.
   - Railway will automatically detect the .NET 10 project.
3. In the **Variables** tab of the backend service, add the following environment variables:

```ini
# Connect to Railway PostgreSQL (Use Railway variable reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ASP.NET Core Environment
ASPNETCORE_ENVIRONMENT=Production

# JWT Configuration
JwtSettings__Secret=your_jwt_secret_key_minimum_32_characters
JwtSettings__Issuer=SashrikaRealEstate
JwtSettings__Audience=SashrikaRealEstateApp

# Cloudinary Storage Configuration
CloudinarySettings__CloudName=your_cloudinary_cloud_name
CloudinarySettings__ApiKey=your_cloudinary_api_key
CloudinarySettings__ApiSecret=your_cloudinary_api_secret
CloudinarySettings__Folder=sasrika/properties

# Google OAuth Client ID
Authentication__Google__ClientId=your_google_client_id.apps.googleusercontent.com

# Admin Master Key
AdminSettings__MasterKey=your_admin_master_key
```

4. In **Settings** > **Networking**, click **Generate Domain** (e.g., `your-railway-app.up.railway.app`).
5. Your production API base endpoint will be:
   `https://your-railway-app.up.railway.app/api`

---

### Vercel Setup (Frontend SPA & Routing)

#### Step 1: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project** and import the GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 2: Configure Vercel Environment Variables
In **Project Settings > Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-railway-app.up.railway.app/api` |
| `VITE_GOOGLE_CLIENT_ID` | `your_google_client_id.apps.googleusercontent.com` |

#### Step 3: Verify Single-Page Application (SPA) Routing Rewrite
Ensure `Frontend/vercel.json` exists in your repository to prevent 404 errors on route reloads:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Deploy the application. Vercel will assign a production domain (e.g., `https://your-app.vercel.app`).

---

### Google Cloud Console Configuration (OAuth 2.0)

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Under **APIs & Services > Credentials**, create or edit an **OAuth 2.0 Client ID** (Web application).
3. Configure **Authorized JavaScript Origins**:
   - `http://localhost:5173` *(Local development)*
   - `https://your-app.vercel.app` *(Production domain)*
4. Configure **Authorized Redirect URIs**:
   - `http://localhost:5173`
   - `https://your-app.vercel.app`
5. Save changes.

---

### Cloudinary Media Storage Configuration

1. Log in to the [Cloudinary Console](https://cloudinary.com/console).
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard.
3. Configure these values in your hosting environment variables (e.g., Railway).
4. In `PhotoService.cs`, all media uploads pass through the authenticated SDK, applying auto-format (`f_auto`) and quality compression (`q_auto`).

---

## 7. Authentication, Roles & Security

### Authentication Architecture & Workflows

Sashrika Real Estate supports dual-mode user authentication:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as React SPA (AuthContext)
    participant Google as Google Identity Services
    participant API as ASP.NET Core API (/api/auth)
    participant DB as PostgreSQL Database

    alt Google Sign-In Flow
        User->>Frontend: Click "Sign in with Google"
        Frontend->>Google: Open Google Sign-In Popup
        Google-->>Frontend: Returns ID Token (credential)
        Frontend->>API: POST /api/auth/google { credential }
        API->>Google: Validate token signature & audience
        Google-->>API: Valid Payload (email, name, picture, sub)
        API->>DB: Query User by Email
        alt User does not exist
            API->>DB: Create new User (Role: "User", GoogleId)
        else User exists
            API->>DB: Link GoogleId & update profile picture
        end
        API-->>Frontend: Return JWT Token + User Profile
    else Standard Email & Password Flow
        User->>Frontend: Enter Email + Password (min. 8 characters)
        Frontend->>API: POST /api/auth/login { email, password }
        API->>DB: Query User by Email
        API->>API: Verify password hash (PasswordHasher<User>)
        API-->>Frontend: Return JWT Token + User Profile
    end

    Frontend->>Frontend: Save token in localStorage ('sasrika_token')
    Frontend->>User: Update UI state (authenticated)
```

---

### Role-Based Access Control (RBAC) & Admin Verification

| Role | Permissions & Privileges |
| :--- | :--- |
| **User** | - Submit new properties for moderation.<br>- View, edit, and delete self-submitted properties.<br>- Mark self-submitted properties as Sold.<br>- Favorite listings (persisted locally). |
| **Admin** | - Full access to all properties across all users.<br>- Access the Admin Moderation Dashboard (`/admin`).<br>- Approve or reject pending property submissions.<br>- Permanently delete any property listing.<br>- View system-wide statistics (total, pending, approved, rejected). |

#### Two-Layer Admin Authorization
1. **Frontend Layer**: `ProtectedRoute` checks standard authentication. Visiting `/admin` challenges the user with a master security key prompt.
2. **Backend Layer**: All `/api/admin/*` endpoints require the `X-Admin-Key` header matching `AdminSettings:MasterKey`.

---

### Frontend Route Protection

The `ProtectedRoute.jsx` component wraps private routes:

```jsx
<Route
  path="/my-listings"
  element={
    <ProtectedRoute>
      <MyListingsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

Unauthenticated users attempting to access these routes are redirected to `/`, their intended path is stored in `sessionStorage`, and the authentication modal is automatically opened.

---

### Backend JWT Token Validation & CORS Policies

- **Algorithm**: Symmetric HMAC-SHA256 (`HmacSha256`).
- **Token Claims**: `NameIdentifier` (User GUID), `Email`, `Name`, `Role`.
- **Token Expiry**: 7 days from generation.
- **Clock Skew**: `TimeSpan.Zero` for strict expiration enforcement.
- **CORS Configuration**: Configured with `SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials()` to allow communication from production Vercel domains, preview deployments, and local development hosts.

---

## 8. Core Operational Workflows

### Property Listing Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: User fills "Post New Property" form
    Draft --> Uploading: Upload photos (up to 10)
    Uploading --> Pending: POST /api/properties (Status: Pending)
    
    state AdminModeration {
        Pending --> Approved: Admin clicks "Approve" (PUT /api/admin/properties/{id}/approve)
        Pending --> Rejected: Admin clicks "Reject" (PUT /api/admin/properties/{id}/reject)
    }

    Approved --> PublicListing: Displayed on Public Search & Home Grid
    Rejected --> Hidden: Hidden from public; visible in owner's My Listings
    
    PublicListing --> Sold: Owner marks as Sold (PATCH /api/properties/{id}/toggle-sold)
    PublicListing --> Deleted: Owner or Admin deletes listing (DELETE /api/properties/{id})
    Rejected --> Deleted: Owner or Admin deletes listing
    
    Deleted --> [*]
```

---

### Multi-Image Upload Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Field as ImageUploadField.jsx
    participant Controller as UploadController.cs
    participant Service as PhotoService.cs
    participant Cloudinary as Cloudinary API

    User->>Field: Selects/drops up to 10 image files
    Field->>Field: Client validation (size <= 15MB, valid extensions)
    Field->>Controller: POST /api/upload/images (multipart/form-data)
    Note over Controller: Validates file count <= 10<br/>Validates MIME types & extensions
    Controller->>Service: UploadPhotosAsync(files, baseUrl)
    loop For each file
        Service->>Cloudinary: UploadAsync (Folder: "sasrika/properties", f_auto, q_auto)
        Cloudinary-->>Service: Returns secure HTTPS Cloudinary URL
    end
    Service-->>Controller: List of uploaded image URLs
    Controller-->>Field: HTTP 200 OK { urls: ["https://res.cloudinary.com/..."] }
    Field->>Field: Update form state & display thumbnail previews
```

- **Batch Size Limit**: Up to 10 images per batch.
- **File Size Limit**: 15 MB per file; 150 MB total per upload request.
- **Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.

---

### Strict Sri Lankan Phone Number Validation

To ensure reliable WhatsApp and telephone communication between buyers and sellers, all phone number fields enforce strict Sri Lankan phone validation:

1. **Frontend Restrictions (`onChange` & `maxLength`)**:
   - Strips non-digit characters immediately: `e.target.value.replace(/\D/g, '').slice(0, 10)`.
   - Restricts maximum input length to 10 characters (`maxLength={10}`).
2. **Validation Rules**:
   - Must start with `0` and be exactly 10 digits (`/^0\d{9}$/`).
   - Inline error message: `"Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567)"`.
   - Disables submit buttons and blocks form submission while the input is invalid.
3. **Backend DTO Validation**:
   - Both `CreatePropertyDto` and `UpdatePropertyDto` enforce:
     ```csharp
     [Required(ErrorMessage = "Seller phone is required")]
     [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must start with 0 and be exactly 10 digits (e.g., 0771234567).")]
     string SellerPhone
     ```

---

### Search, Filter & Sorting Pipeline

The public property query endpoint (`GET /api/properties`) supports composable, real-time filtering:

| Filter Parameter | Query Key | Mechanism |
| :--- | :--- | :--- |
| **Search Term** | `searchTerm` | Case-insensitive substring match against `Title`, `Description`, `City`, and `District`. |
| **Listing Type** | `listingType` | Filters by `ForSale` (0) or `ForRent` (1). |
| **Property Type** | `propertyType` | Filters by `House` (0), `Land` (1), or `Commercial` (2). |
| **District** | `district` | Matches one of Sri Lanka's 25 administrative districts. |
| **City** | `city` | Matches specific city or municipality. |
| **Price Bounds** | `minPrice`, `maxPrice` | Filters listings within price range bounds. |
| **Sorting** | `sortBy` | Options: `newest` (default), `price_asc` (low to high), `price_desc` (high to low). |

---

### User Inquiry & WhatsApp Contact Flow

1. **Viewing Details**: A buyer views a listing at `/property/:id`.
2. **WhatsApp Action**: Clicking the **WhatsApp** button triggers a direct WhatsApp link:
   ```
   https://wa.me/{SellerPhone}?text=Hi%2C%20I%20am%20interested%20in%20your%20listing%3A%20%22{Title}%22%20(Price%3A%20{Price})%20listed%20on%20Sashrika.
   ```
3. **Direct Call Action**: Clicking the **Call** button triggers a `tel:{SellerPhone}` link.
4. **Reference Code**: Every communication incorporates the unique reference code (e.g., `#SR-84920`), allowing the seller to identify the listing immediately.

---

*Documentation maintained and sanitized for public repository release.*
