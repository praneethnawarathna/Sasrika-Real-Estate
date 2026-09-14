# Sasrika Real Estate — System Documentation

A comprehensive, production-grade technical manual detailing the architecture, technology stack, directory structures, environment configurations, local development workflow, production deployment guides, security model, and core operational workflows for the **Sasrika Real Estate** platform.

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
   - [Search, Filter & Sorting Pipeline](#search-filter--sorting-pipeline)
   - [User Inquiry & WhatsApp Contact Flow](#user-inquiry--whatsapp-contact-flow)

---

## 1. Executive Summary & Architecture Overview

Sasrika Real Estate is a modern, high-performance web platform designed to facilitate real estate listings, browsing, user interactions, and admin moderation in Sri Lanka. The application follows a decoupled, headless client-server architecture:

- **Single-Page Application (SPA) Frontend**: Built using React 19 and Vite, deployed globally on Vercel's Edge Network for rapid asset delivery and client-side page rendering.
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

- **Database Engine**: PostgreSQL 15+ / 16 (Hosted on Railway managed infrastructure).
- **Object Storage**: Cloudinary (Cloud-based Digital Asset Management).
- **Local Fallback Storage**: `Backend/wwwroot/uploads` (for local environments without Cloudinary credentials configured).

### Cloud Hosting & Infrastructure

- **Frontend Hosting**: Vercel (Global Edge Network, automatic SSL, SPA routing via `vercel.json`).
- **Backend Hosting**: Railway (Containerized .NET 10 runtime, automatic container restart, environment secret management).
- **Database Hosting**: Railway PostgreSQL Plugin (Internal private network communication via `postgres.railway.internal`).

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
│   ├── .env
│   ├── .env.production
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
│   ├── AddPropertyModal.jsx      # Modal form for submitting new properties with multi-image upload
│   ├── AuthModal.jsx             # Authentication modal (Email/Password & Google Sign-In)
│   ├── EditPropertyModal.jsx     # Modal for updating existing property listings
│   ├── Footer.jsx                # Global site footer with links and company info
│   ├── ImageUploadField.jsx      # Multi-image drag-and-drop & batch file upload component (up to 10 images)
│   ├── Navbar.jsx                # Responsive header with search trigger, navigation links, and auth controls
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
├── utils/                        # Formatting helpers (currency formatters, date formatters, telephone helpers)
├── App.css                       # Application-specific global styles and animations
├── App.jsx                       # Root routing configuration and modal container
├── index.css                     # Tailwind CSS direct directives and base styles
└── main.jsx                      # React application entry point (mounts to #root)
```

#### Frontend Modules & Responsibilities

1. **`src/config/api.js`**:
   - Centralizes the Backend API configuration.
   - Reads `import.meta.env.VITE_API_BASE_URL` with a fallback to `http://localhost:5143/api`.
   - Exposes standardized endpoints for `properties`, `auth`, `admin`, and `upload`.

2. **`src/context/AuthContext.jsx`**:
   - Manages user login state, JWT storage (`sasrika_token`), and user profile (`sasrika_user`) in `localStorage`.
   - Exposes authentication methods: `login()`, `register()`, `loginWithGoogle()`, and `logout()`.
   - Provides `authFetch()`: a wrapper around the native Fetch API that automatically attaches the `Authorization: Bearer <token>` header to requests and triggers an automatic logout if a 401 Unauthorized response is encountered.

3. **`src/components/ProtectedRoute.jsx`**:
   - Prevents unauthenticated users from accessing protected pages (e.g., `/admin`, `/my-listings`).
   - If the user is unauthenticated, preserves the target URL in `sessionStorage` (`sasrika_redirect_after_login`), dispatches a custom browser event (`sasrika:open-auth-modal`) to prompt the user to sign in, and redirects to `/`.

4. **`src/components/ImageUploadField.jsx`**:
   - Multi-file image upload handler supporting up to 10 photos simultaneously.
   - Handles Drag & Drop, client-side validation (formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`; max 15 MB per file), displays upload progress, and renders a thumbnail preview grid with per-image deletion capabilities.

5. **`src/pages/AdminPage.jsx`**:
   - Two-tier security dashboard: requires standard authentication via `ProtectedRoute` and administrative verification via the `X-Admin-Key` header against `POST /api/admin/verify`.
   - Provides administrative controls: approve pending listings, reject listings, delete listings, view platform metrics (total listings, pending, approved, rejected).

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
├── Dtos/                         # Data Transfer Objects for API request and response validation
├── Models/
│   ├── Enum.cs                   # Enumerations: PropertyType, ListingType, ModerationStatus
│   ├── Property.cs               # Property entity definition with validation attributes
│   └── User.cs                   # User entity definition with identity properties and role
├── Properties/
│   └── launchSettings.json       # Local development Kestrel server profiles
├── Services/
│   ├── CloudinarySettings.cs     # Strongly-typed configuration options for Cloudinary credentials
│   ├── IPhotoService.cs          # Interface contract for photo upload services
│   ├── PhotoService.cs           # Implementation of Cloudinary image upload with optimization transformations
│   ├── IPropertyService.cs       # Interface contract for property business logic
│   └── PropertyService.cs        # Property domain service implementation
├── wwwroot/
│   └── uploads/                  # Local directory for media storage fallback
├── appsettings.json              # Base application configuration
├── appsettings.Development.json  # Local development overrides
├── appsettings.Production.json   # Production logging and configuration overrides
├── Program.cs                    # Application entry point, dependency injection, middleware pipeline
└── RealEstate.Api.csproj         # Project manifest, package references, and target framework (.NET 10)
```

#### Backend Modules & Responsibilities

1. **`Program.cs`**:
   - Configures PostgreSQL connection parsing: translates standard Heroku/Railway URI formats (`postgresql://user:pass@host:port/db`) into Npgsql connection strings with `SSL Mode=Prefer;Trust Server Certificate=true`.
   - Registers services: `AppDbContext`, `IPasswordHasher<User>`, `IPhotoService`, and `CloudinarySettings`.
   - Configures JWT Bearer authentication with issuer, audience, and symmetric key validation.
   - Configures permissive CORS enabling smooth communication between production Vercel domains and the Railway backend.
   - Executes database bootstrapping on startup via `db.Database.EnsureCreated()`, auto-seeding the initial Administrator account (`admin@sasrika.lk`) and reconciling orphan records.

2. **`Data/AppDbContext.cs`**:
   - Manages relational mapping for `Users` and `Properties`.
   - Implements an EF Core `ValueConverter` to serialize `List<string>` property image URLs into a single JSON column in PostgreSQL, ensuring database portability.

3. **`Controllers/AuthController.cs`**:
   - `POST /api/auth/register`: Hashes passwords using ASP.NET Core's cryptographic `PasswordHasher<User>` and issues JWTs.
   - `POST /api/auth/login`: Validates credentials against stored password hashes.
   - `POST /api/auth/google`: Accepts Google ID tokens, validates signatures cryptographically against Google public keys via `GoogleJsonWebSignature.ValidateAsync`, and provisions or links user accounts seamlessly.

4. **`Controllers/PropertiesController.cs`**:
   - `GET /api/properties`: Retrieves approved listings with advanced filtering (district, city, price range, listing type, property type, search term, sorting).
   - `POST /api/properties`: Authenticated endpoint to post new properties; automatically assigns `Pending` moderation status.
   - `PUT /api/properties/{id}` & `DELETE /api/properties/{id}`: Validates ownership or administrator privileges before allowing modifications.

5. **`Controllers/UploadController.cs` & `Services/PhotoService.cs`**:
   - `POST /api/upload/images`: Accepts up to 10 image files (`IFormFile`) per request with a 150 MB total payload limit.
   - Passes files to `PhotoService`, which uploads them to the `sasrika/properties` Cloudinary folder, applying automatic WebP format conversion (`f_auto`) and quality compression (`q_auto`). Returns an array of secure URLs (`https://res.cloudinary.com/...`).

---

## 4. Environment Configuration Reference

### Frontend Environment Variables

Configure these variables in `Frontend/.env` (Local) and in the **Vercel Project Settings > Environment Variables** (Production).

| Variable Name | Required | Default / Local Example | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:5143/api` | `https://sasrika-real-estate-production.up.railway.app/api` | Base URL pointing to the Backend API. |
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | `8700404392-...apps.googleusercontent.com` | `8700404392-...apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID used by the Google Identity Services popup. |

---

### Backend Environment Variables & Configuration

Configure these variables in `Backend/appsettings.json` (Local) and in the **Railway Project Settings > Variables** (Production).

| Variable / Key | Required | Production / Secret Format | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:port/railway` | PostgreSQL URI injected automatically by Railway. Parsed in `Program.cs` into an Npgsql connection string. |
| `ConnectionStrings__DefaultConnection` | Optional | `Host=localhost;Port=5432;Database=sasrika;Username=postgres;Password=...` | Fallback connection string if `DATABASE_URL` is not defined. |
| `ASPNETCORE_ENVIRONMENT` | **Yes** | `Production` (or `Development` locally) | Sets ASP.NET Core environment mode. Controls Swagger visibility and detailed error reporting. |
| `JwtSettings__Secret` | **Yes** | *Cryptographically strong secret key (min. 32 chars)* | Symmetric key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JwtSettings__Issuer` | **Yes** | `SasrikaRealEstate` | Expected token issuer (`iss` claim). |
| `JwtSettings__Audience` | **Yes** | `SasrikaRealEstateApp` | Expected token audience (`aud` claim). |
| `CloudinarySettings__CloudName` | **Yes** | `cczoij74` | Cloudinary account Cloud Name. |
| `CloudinarySettings__ApiKey` | **Yes** | `447746453132182` | Cloudinary API Key. |
| `CloudinarySettings__ApiSecret` | **Yes** | *Cloudinary API Secret* | Cloudinary API Secret for signed REST uploads. |
| `CloudinarySettings__Folder` | **Yes** | `sasrika/properties` | Cloudinary folder under which property images are stored. |
| `Authentication__Google__ClientId` | **Yes** | `8700404392-...apps.googleusercontent.com` | Google OAuth Client ID validated by backend when verifying tokens. |
| `AdminSettings__MasterKey` | **Yes** | *Custom administrative password* | Master secret key used to verify admin access via `X-Admin-Key` header. |

---

## 5. Step-by-Step Local Setup Guide

### Prerequisites

Ensure the following tools are installed on your workstation:
- **.NET 10 SDK**: Verify using `dotnet --version`
- **Node.js (v20+ LTS) & npm**: Verify using `node -v` and `npm -v`
- **PostgreSQL (v15+)**: Running locally or accessible via network
- **Git**: For version control

---

### Backend Local Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Configure Database Connection**:
   Open `appsettings.Development.json` or `appsettings.json` and set your local PostgreSQL connection string under `ConnectionStrings:DefaultConnection`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=sasrika_dev;Username=postgres;Password=your_password;SSL Mode=Prefer;Trust Server Certificate=true"
     },
     "JwtSettings": {
       "Secret": "DevelopmentSecretKeyForSasrikaRealEstateMustBe32CharactersOrMore!",
       "Issuer": "SasrikaRealEstate",
       "Audience": "SasrikaRealEstateApp"
     },
     "CloudinarySettings": {
       "CloudName": "your_cloud_name",
       "ApiKey": "your_api_key",
       "ApiSecret": "your_api_secret",
       "Folder": "sasrika/properties"
     },
     "Authentication": {
       "Google": {
         "ClientId": "your_google_client_id.apps.googleusercontent.com"
       }
     },
     "AdminSettings": {
       "MasterKey": "DevAdminKey123"
     }
   }
   ```

3. **Restore NuGet Packages**:
   ```bash
   dotnet restore
   ```

4. **Run the Backend API**:
   ```bash
   dotnet run
   ```
   - The API will start on `http://localhost:5143` (HTTP) and `https://localhost:7143` (HTTPS).
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
   Create or verify the `Frontend/.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5143/api
   VITE_GOOGLE_CLIENT_ID=8700404392-ce6khm9cklapb7ej03mr73ojnb8bfsiu.apps.googleusercontent.com
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
4. Click **+ Add Property** to ensure the modal opens, upload test images, and submit a test listing.
5. Visit `http://localhost:5173/admin`, enter your configured Admin Master Key, and confirm that the submitted property appears in the Pending Moderation queue.

---

## 6. Step-by-Step Production Deployment Guide

### Railway Setup (PostgreSQL Database & Backend API)

Railway hosts both the managed PostgreSQL database and the ASP.NET Core containerized Web API.

```
Railway Project Dashboard
├── Service 1: PostgreSQL Database (Plugin)
│   └── Variables: Provides DATABASE_URL automatically
└── Service 2: Sasrika Backend (ASP.NET Core Web API)
    ├── Connected to GitHub repository (Backend root)
    └── Variables: Linked DATABASE_URL, JWT, Cloudinary, and Google credentials
```

#### Step 1: Provision the PostgreSQL Database on Railway
1. Log in to [Railway](https://railway.app/).
2. Create a new project or select your existing project (`Sasrika-Real-Estate`).
3. Click **+ New** > **Database** > **Add PostgreSQL**.
4. Railway will spin up a PostgreSQL instance. In the database's **Variables** tab, you will find `DATABASE_URL` (e.g., `postgresql://postgres:password@postgres.railway.internal:5432/railway`).

#### Step 2: Deploy the Backend Service
1. Click **+ New** > **GitHub Repo** and select the repository.
2. In the deployment settings:
   - **Root Directory**: Set to `/Backend` (if repository contains both frontend and backend).
   - Railway will automatically detect the .NET project using its Nixpacks builder.
3. In the **Variables** tab of the backend service, add the following environment variables:

```ini
# Connect to Railway PostgreSQL (Use Railway variable reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ASP.NET Core Environment
ASPNETCORE_ENVIRONMENT=Production

# JWT Configuration
JwtSettings__Secret=SasrikaRealEstateSuperSecretKey2026!MustBeLongEnoughForHmacSha256SecurityRequirement
JwtSettings__Issuer=SasrikaRealEstate
JwtSettings__Audience=SasrikaRealEstateApp

# Cloudinary Storage Configuration
CloudinarySettings__CloudName=cczoij74
CloudinarySettings__ApiKey=447746453132182
CloudinarySettings__ApiSecret=q6zW7MDrhtlNLDKxMR4qYkKiRyc
CloudinarySettings__Folder=sasrika/properties

# Google OAuth Client ID
Authentication__Google__ClientId=8700404392-ce6khm9cklapb7ej03mr73ojnb8bfsiu.apps.googleusercontent.com

# Admin Master Key
AdminSettings__MasterKey=Maalz
```

4. In **Settings** > **Networking**, click **Generate Domain** (e.g., `sasrika-real-estate-production.up.railway.app`).
5. Your production API base endpoint will be:
   `https://sasrika-real-estate-production.up.railway.app/api`

---

### Vercel Setup (Frontend SPA & Routing)

Vercel hosts the compiled React SPA and manages edge delivery.

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
In the project import page (or **Project Settings > Environment Variables**), add:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://sasrika-real-estate-production.up.railway.app/api` |
| `VITE_GOOGLE_CLIENT_ID` | `8700404392-ce6khm9cklapb7ej03mr73ojnb8bfsiu.apps.googleusercontent.com` |

#### Step 3: Verify Single-Page Application (SPA) Routing Rewrite
Ensure `Frontend/vercel.json` exists in your repository to prevent 404 errors when users directly reload deep routes like `/admin`, `/my-listings`, or `/property/123`:

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

Click **Deploy**. Vercel will build and assign a domain (e.g., `https://sasrika-real-estate-bh9k.vercel.app`).

---

### Google Cloud Console Configuration (OAuth 2.0)

To allow users to sign in via Google OAuth on both local and production environments:

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and navigate to **APIs & Services > Credentials**.
3. Locate or create an **OAuth 2.0 Client ID** (Application type: **Web application**).
4. Configure **Authorized JavaScript Origins**:
   - `http://localhost:5173` *(Local development)*
   - `https://sasrika-real-estate-bh9k.vercel.app` *(Production Vercel domain)*
   - *(Optional: Add custom production domain if applicable)*
5. Configure **Authorized Redirect URIs**:
   - `http://localhost:5173`
   - `https://sasrika-real-estate-bh9k.vercel.app`
6. Save changes. Google OAuth tokens will now be accepted by both environments.

---

### Cloudinary Media Storage Configuration

1. Log in to your [Cloudinary Console](https://cloudinary.com/console).
2. Retrieve your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard.
3. Configure these values in Railway environment variables as detailed in the Railway setup section.
4. *(Optional)* Navigate to **Settings > Upload** and create an upload preset if direct uploads are required in future extensions. In the current architecture, all uploads pass through `Backend/Services/PhotoService.cs` using authenticated SDK credentials.

---

## 7. Authentication, Roles & Security

### Authentication Architecture & Workflows

Sasrika Real Estate supports dual-mode user authentication:

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
        User->>Frontend: Enter Email + Password
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

The platform defines two user roles in the `User` model:

| Role | Permissions & Privileges |
| :--- | :--- |
| **User** | - Submit new properties for moderation.<br>- View, edit, and delete self-submitted properties.<br>- Mark self-submitted properties as Sold.<br>- Favorite listings (persisted locally). |
| **Admin** | - Full access to all properties across all users.<br>- Access the Admin Moderation Dashboard (`/admin`).<br>- Approve or reject pending property submissions.<br>- Permanently delete any property listing.<br>- View system-wide statistics (total, pending, approved, rejected). |

#### Two-Layer Admin Authorization
To protect sensitive moderation endpoints, the platform implements defense-in-depth:
1. **Frontend Layer**: `ProtectedRoute` checks user authentication. On `/admin`, `AdminPage` challenges the user with a master security key modal if not previously authenticated for the session.
2. **Backend Layer**: All `/api/admin/*` endpoints require the `X-Admin-Key` header (or `adminKey` query parameter) matching `AdminSettings:MasterKey`. This ensures that even compromised standard JWT tokens cannot perform administrative actions without the master key.

---

### Frontend Route Protection

The `ProtectedRoute.jsx` component wraps private routes in `App.jsx`:

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

When an unauthenticated user attempts to visit a protected route:
1. `ProtectedRoute` saves the requested URL in `sessionStorage.setItem('sasrika_redirect_after_login', location.pathname)`.
2. Dispatches `window.dispatchEvent(new CustomEvent('sasrika:open-auth-modal'))`.
3. Navigates the user to `/`.
4. Upon successful login, `Navbar.jsx` inspects `sessionStorage` and immediately redirects the user to their originally requested destination.

---

### Backend JWT Token Validation & CORS Policies

- **Algorithm**: Symmetric HMAC-SHA256 (`HmacSha256`).
- **Token Claims**:
  - `ClaimTypes.NameIdentifier`: User GUID.
  - `ClaimTypes.Email`: User email.
  - `ClaimTypes.Name`: User full name.
  - `ClaimTypes.Role`: User role (`"User"` or `"Admin"`).
- **Token Expiry**: 7 days from generation.
- **Clock Skew**: `TimeSpan.Zero` for strict expiration enforcement.
- **CORS Configuration**: Configured with `SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials()` to allow cross-origin communication from production Vercel domains, preview deployments, and local development hosts.

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
    
    PublicListing --> Sold: Owner marks as Sold (PUT /api/properties/{id}/sold)
    PublicListing --> Deleted: Owner or Admin deletes listing (DELETE /api/properties/{id})
    Rejected --> Deleted: Owner or Admin deletes listing
    
    Deleted --> [*]
```

1. **Submission**: User completes property details in `AddPropertyModal.jsx` and attaches photos.
2. **Validation**: Price, location, property type, and contact details are validated on both client and server.
3. **Price-per-Perch Calculation**: If the property is `Land` and `ForSale`, the backend automatically calculates `PricePerPerch = Price / LandSizePerches`. For other property types, this field is explicitly set to `null`.
4. **Moderation Queue**: The property is assigned `Status = ModerationStatus.Pending` and an identifier like `#SR-12345`.
5. **Approval**: An admin reviews the listing in `/admin` and approves it. The status updates to `Approved`, making it visible to the public.

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
- **CDN Optimization**: Every Cloudinary URL includes automatic format conversion (`f_auto`) and quality compression (`q_auto`).

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

Each approved property listing enables interested buyers to contact the property seller directly:

1. **Viewing Details**: A buyer views a listing at `/property/:id`.
2. **WhatsApp Action**: Clicking the **WhatsApp** button triggers a direct WhatsApp Web or Mobile link:
   ```
   https://wa.me/{SellerPhone}?text=Hi%2C%20I%20am%20interested%20in%20your%20property%20%22{Title}%22%20(Ref%3A%20{ReferenceCode})%20on%20Sasrika%20Real%20Estate.
   ```
3. **Direct Call Action**: Clicking the **Call** button triggers a `tel:{SellerPhone}` protocol link.
4. **Reference Code**: Every communication automatically incorporates the unique reference code (e.g., `#SR-84920`), allowing the seller to identify the listing immediately.

---

*Documentation maintained and generated for the Sasrika Real Estate project repository.*
