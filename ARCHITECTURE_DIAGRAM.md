# urBackend — Architecture Diagram

## 1. System Overview

```mermaid
graph TB
    subgraph Clients["👤 Clients"]
        DEV["Developer\n(Dashboard User)"]
        EXTAPP["External App\n(API Consumer)"]
    end

    subgraph Frontend["🖥️ Frontend — Vite + React\nurbackend.bitbros.in"]
        PAGES["Pages\nLogin / Register / Dashboard\nProject Detail / Storage / Analytics"]
        CTX["AuthContext"]
        COMPS["Components\nNavbar / Modals / Tables / Charts"]
    end

    subgraph Backend["⚙️ Backend — Express.js\nRender / Railway"]
        APP["app.js\nEntry Point"]

        subgraph Middleware["🛡️ Middleware"]
            RL_DASH["dashboardLimiter\n1000 req / 15 min"]
            RL_API["apiLimiter\n(limiter)"]
            CORS_ADMIN["adminCorsOptions\nWhitelist CORS"]
            AUTH_MW["authMiddleware\nJWT (Developer)"]
            API_MW["verifyApiKey\nHashed API Key + Redis Cache"]
            VERIFY_EMAIL["verifyEmail\nOwner isVerified check"]
            LOGGER["logger\nAPI usage logger"]
        end

        subgraph Routes["📡 Routes"]
            R_AUTH["/api/auth"]
            R_PROJ["/api/projects"]
            R_DATA["/api/data"]
            R_UAUTH["/api/userAuth"]
            R_STORE["/api/storage"]
            R_SCHEMA["/api/schemas"]
        end

        subgraph Controllers["🧩 Controllers"]
            C_AUTH["auth.controller\nregister / login\nchange-password / delete\nsendOtp / verifyOtp"]
            C_PROJ["project.controller\ncreateProject / updateProject\ncreateCollection / deleteCollection\ngetData / insertData / editRow\ndeleteRow / uploadFile / listFiles\ndeleteFile / analytics\nupdateExternalConfig"]
            C_DATA["data.controller\ninsertData / getAllData\ngetSingleDoc / updateSingleData\ndeleteSingleDoc"]
            C_UAUTH["userAuth.controller\nsignup / login / me"]
            C_STORE["storage.controller\nuploadFile / deleteFile\ndeleteAllFiles"]
            C_SCHEMA["schema.controller\ncheckSchema / createSchema"]
        end

        subgraph Utils["🔧 Utils / Services"]
            CONN_MGR["connection.manager\nBYOD DB connections\n(registry cache)"]
            INJECT["injectModel\nDynamic Mongoose Model"]
            QUERY["queryEngine\nDynamic Query Builder"]
            STORE_MGR["storage.manager\nSupabase / External Storage"]
            EMAIL["emailService\nNodemailer / SMTP"]
            ENCRYPT["encryption\nAES-256-GCM"]
            GC["GC.js\nGarbage Collector\n(stale connections + storage)"]
            REDIS["redisCaching.js\nProject-by-APIKey Cache"]
            VALID["input.validation\nSchema-based Validator"]
        end
    end

    subgraph Data["🗄️ Data Layer"]
        MONGO_MAIN["MongoDB Atlas\n(urBackend Internal DB)"]
        MONGO_EXT["External MongoDB\n(BYOD — User's own DB)"]
        SUPABASE["Supabase Storage\n(urBackend Internal)"]
        SUPABASE_EXT["External Storage\n(BYOD — User's own)"]
        REDIS_DB["Redis\n(Upstash)"]
    end

    DEV -->|"Browser"| Frontend
    EXTAPP -->|"x-api-key header"| R_DATA & R_UAUTH & R_STORE & R_SCHEMA

    Frontend -->|"JWT Bearer Token"| R_AUTH & R_PROJ
    APP --> Routes
    R_AUTH --> AUTH_MW --> C_AUTH
    R_PROJ --> AUTH_MW --> VERIFY_EMAIL --> C_PROJ
    R_DATA --> API_MW --> LOGGER --> C_DATA
    R_UAUTH --> API_MW --> LOGGER --> C_UAUTH
    R_STORE --> API_MW --> LOGGER --> C_STORE
    R_SCHEMA --> API_MW --> LOGGER --> C_SCHEMA

    C_AUTH --> MONGO_MAIN
    C_PROJ --> CONN_MGR
    C_DATA --> CONN_MGR
    C_UAUTH --> CONN_MGR
    C_STORE --> STORE_MGR
    C_SCHEMA --> CONN_MGR

    CONN_MGR -->|"isExternal: false"| MONGO_MAIN
    CONN_MGR -->|"isExternal: true\n(decrypt config)"| MONGO_EXT
    STORE_MGR -->|"isExternal: false"| SUPABASE
    STORE_MGR -->|"isExternal: true"| SUPABASE_EXT

    API_MW -->|"Cache lookup"| REDIS_DB

    C_AUTH --> EMAIL
```

---

## 2. API Request Flow — External App (API Key)

```mermaid
sequenceDiagram
    participant App as External App
    participant MW as verifyApiKey Middleware
    participant Redis as Redis Cache
    participant DB as MongoDB (Projects)
    participant Ctrl as Controller
    participant DataDB as Data DB (Internal / External)

    App->>MW: Request with x-api-key header
    MW->>Redis: Lookup hashed API key
    alt Cache hit
        Redis-->>MW: Return cached project
    else Cache miss
        MW->>DB: findOne({ apiKey: hashedKey })
        DB-->>MW: Project doc (with owner, resources)
        MW->>Redis: Store in cache
    end
    MW->>MW: Check owner.isVerified
    MW->>Ctrl: req.project attached → next()
    Ctrl->>DataDB: Query (internal or external via connection.manager)
    DataDB-->>Ctrl: Results
    Ctrl-->>App: JSON Response
```

---

## 3. BYOD (Bring Your Own Database/Storage) Flow

```mermaid
flowchart TD
    A["API Request arrives"] --> B["verifyApiKey middleware\nattaches req.project"]
    B --> C{"project.resources.db\n.isExternal?"}
    C -->|No| D["Use urBackend shared\nMongoDB connection"]
    C -->|Yes| E["connection.manager.js\nCheck registry cache"]
    E --> F{"Active connection\nin registry?"}
    F -->|Yes| G["Reuse cached connection"]
    F -->|No| H["Decrypt AES-256-GCM\ncredentials from Project doc"]
    H --> I["mongoose.createConnection(dbUri)"]
    I --> J["Store in registry\nwith lastAccessed timestamp"]
    J --> G
    G --> K["injectModel.js\nCreate dynamic Mongoose model\nfor collection + schema"]
    D --> K
    K --> L["queryEngine.js\nBuild + execute query"]
    L --> M["Return result to controller"]
```

---

## 4. MongoDB Data Models

```mermaid
erDiagram
    Developer {
        ObjectId _id
        string email
        string password
        boolean isVerified
        date createdAt
        date updatedAt
    }

    Project {
        ObjectId _id
        string name
        string description
        ObjectId owner
        string apiKey
        string jwtSecret
        number storageUsed
        number storageLimit
        number databaseUsed
        number databaseLimit
        object resources
        date createdAt
        date updatedAt
    }

    Collection {
        string name
        FieldSchema[] model
    }

    FieldSchema {
        string key
        string type
        boolean required
    }

    OTP {
        ObjectId userId
        string otp
        date createdAt
    }

    Log {
        ObjectId project
        string method
        string route
        number status
        number responseTime
        date createdAt
    }

    Developer ||--o{ Project : "owns"
    Project ||--o{ Collection : "has"
    Collection ||--o{ FieldSchema : "has fields"
    Project ||--o{ Log : "generates"
    Developer ||--o{ OTP : "receives"
```

---

## 5. Frontend Structure (Vite + React)

```mermaid
graph TD
    subgraph Entry["Entry"]
        MAIN["main.jsx"]
        APP["App.jsx\nReact Router"]
    end

    subgraph Providers["Providers"]
        AUTHCTX["AuthContext\n(JWT token + developer state)"]
    end

    subgraph Pages["Pages"]
        LP["Landing Page"]
        LOGIN["Login / Register"]
        DASH["Dashboard\n(Projects list)"]
        PROJ["Project Detail\n(Collections, API Key, Settings)"]
        COLL["Collection View\n(Browse & manage data)"]
        STORE_PG["Storage Page\n(File upload / delete)"]
        ANALYTICS["Analytics Page"]
        PROFILE["Profile Page"]
        BYOD_PG["BYOD Config Page"]
    end

    subgraph Components["Shared Components"]
        NAVBAR["Navbar"]
        SIDEBAR["Sidebar"]
        MODALS["Modals\n(Create Project / Collection,\nBulk Mail, Schema, etc.)"]
        TABLES["Data Tables"]
        CHARTS["Usage Charts"]
    end

    MAIN --> APP
    APP --> AUTHCTX
    AUTHCTX --> Pages
    Pages --> Components
    Pages -->|"fetch / axios"| BackendAPI["Backend REST API"]
```

---

## 6. Security & Rate Limiting

| Layer | Mechanism | Limit / Detail |
|---|---|---|
| Dashboard routes (`/api/auth`, `/api/projects`) | `dashboardLimiter` | 1000 req / 15 min |
| API consumer routes | `limiter` (custom) | Configurable |
| Developer auth | JWT (`authMiddleware`) | Bearer token, signed per dev |
| API consumer auth | `verifyApiKey` | SHA-256 hashed key + Redis cache |
| Email verification gate | `verifyEmail` | `owner.isVerified` must be `true` |
| CORS | `adminCorsOptions` | Whitelist: `urbackend.bitbros.in` only |
| Credential storage | AES-256-GCM encryption | BYOD DB/Storage configs encrypted in MongoDB |
| File uploads | `multer` memory storage | 10 MB per file limit |

---

## 7. Infrastructure Overview

```mermaid
graph LR
    subgraph Hosting["Hosting"]
        FE["Frontend\nVercel"]
        BE["Backend\nRender / Railway"]
    end

    subgraph External["External Services"]
        MONGO["MongoDB Atlas\n(Primary DB)"]
        RDS["Upstash Redis\n(API Key Cache)"]
        SUP["Supabase\n(File Storage)"]
        SMTP["SMTP Server\n(OTP / Emails)"]
    end

    subgraph BYOD["BYOD (User-owned)"]
        USER_MONGO["User's MongoDB Atlas"]
        USER_SUP["User's Supabase"]
    end

    FE -->|"HTTPS REST"| BE
    ExternalApp["External App"]
    FE -->|"HTTPS REST"| BE
    ExternalApp -->|"x-api-key"| BE
    BE --> MONGO
    BE --> RDS
    BE --> SUP
    BE --> SMTP
    BE -.->|"Optional BYOD"| USER_MONGO
    BE -.->|"Optional BYOD"| USER_SUP
```
