# Real-Time Collaborative Audio/Video & Chat Backend
### LVS Innovation Backend Technical Assignment

---

# Project Overview

An enterprise-grade, production-ready backend service built with **NestJS**, **TypeScript**, **MongoDB**, **Redis**, **Socket.IO**, and **LiveKit WebRTC**. It features JWT authentication, persistent room lifecycles, real-time presence tracking, cryptographically signed WebRTC token generation, multi-stage Docker containerization, and automated GitHub Actions CI/CD.

Designed and implemented to fulfill the LVS Innovation Backend Technical Assessment requirements, this service demonstrates resilient distributed systems design, clean architectural separation between control and media planes, robust security controls, and high-concurrency real-time communication.

---

# Features

- **Authentication & Security**:
  - Secure registration and login with `bcrypt` (10 salt rounds).
  - Passwords stripped from responses and excluded by default at schema level (`select: false`).
  - Stateless JWT Bearer authentication with Passport strategy.
  - Role-based authorization guards preventing unauthorized room actions and token minting.
  - Global `ValidationPipe` with payload whitelisting preventing parameter injection.
  - Standardized JSON envelope for successes (`{ success: true, data }`) and errors (`{ success: false, message, errorCode }`).
- **Room Management & Lifecycle**:
  - Dynamic room creation with optional password protection.
  - Active room discovery and detailed participant roster queries.
  - Duplicate participation prevention via database compound constraints and Redis validation.
  - Host departure lifecycle management: When the host leaves, the room is automatically marked `ENDED` and all peers receive real-time termination notices.
- **Real-Time WebSockets & Presence**:
  - Socket.IO gateway with JWT handshake authentication.
  - Isolated room messaging namespaces (`room:<roomId>`).
  - Real-time online/offline presence tracking backed by Redis TTL keys.
  - Real-time room participant rosters backed by Redis Sets.
- **WebRTC Audio/Video Infrastructure**:
  - LiveKit WebRTC SFU integration.
  - Role-based token issuance ensuring only actual room hosts receive `roomAdmin` grants.
  - Rejection of host impersonation with `403 Forbidden`.
- **Containerization & Deployment Architecture**:
  - Multi-stage, production-ready `Dockerfile` based on `node:20-bookworm-slim`.
  - Full-stack `docker-compose.yml` orchestrating Backend, MongoDB, and Redis with health checks.
  - Comprehensive Ubuntu & Nginx production deployment guide ([`DEPLOYMENT.md`](./DEPLOYMENT.md)).

### Bonus Features Implemented
- **Interactive OpenAPI / Swagger Documentation**: Full interactive testing console at `/api-docs` with JWT Bearer authentication support and strict DTO schemas.
- **GitHub Actions CI/CD Pipeline**: Automated 7-step CI pipeline in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) testing linting, buildability, unit test pass rate, and Docker image compilation on push and pull requests.
- **Automated Business Logic Test Suite**: Comprehensive 13-test Jest suite in `assignment-core.spec.ts` guaranteeing 100% test pass rate for registration, login, authorization, room lifecycle, duplicate guards, and LiveKit token security.
- **Container Health Checks**: Built-in Docker Compose health checks for MongoDB and Redis with restart policies.
- **Enterprise Error Envelope**: Global exception interceptor and filter standardizing all API responses into `{ success: true, data }` and `{ success: false, message, errorCode }`.

---


# Architecture

```text
                               +-------------------+
                               |   Client Browser  |
                               +---------+---------+
                                         |
             +---------------------------+---------------------------+
             |                                                       |
   (HTTP REST / WS Handshake)                                 (WebRTC Media UDP)
             |                                                       |
             v                                                       v
   +-------------------+                                   +-------------------+
   | Nginx / Load Bal. |                                   |   LiveKit SFU     |
   +---------+---------+                                   | (Dedicated Nodes) |
             |                                             +-------------------+
             v
   +-------------------+
   |   NestJS Nodes    | <---- Issues Signed Access Tokens
   | (API / WebSocket) |
   +----+---------+----+
        |         |
        v         v
   +--------+ +--------+
   | Redis  | |MongoDB |
   |Presence| |Data    |
   +--------+ +--------+
```

---

# Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | NestJS | 10.x | Modular dependency injection & API routing |
| **Runtime** | Node.js | 20 LTS | Asynchronous server-side JavaScript runtime |
| **Language** | TypeScript | 5.x | Static typing and interfaces |
| **Database** | MongoDB & Mongoose | 8.x | Document database for persistent domain state |
| **Cache / State** | Redis & ioredis | 7.x | Real-time presence, participant sets, and Pub/Sub |
| **Real-Time WS** | Socket.IO | 4.x | Low-latency bi-directional WebSocket gateway |
| **Media Plane** | LiveKit Server SDK | 2.x | Cryptographic WebRTC token issuance & permission grants |
| **Authentication** | Passport & JWT | 10.x | Bearer token authentication and payload validation |
| **Password Hash** | bcrypt | 5.x | Secure credential hashing (10 rounds) |
| **Validation** | class-validator | 0.14.x | DTO schema validation and payload sanitization |
| **Documentation** | Swagger / OpenAPI | 7.x | Interactive API documentation |
| **Containerization**| Docker & Docker Compose | 24+ | Isolated multi-container deployment |
| **Testing** | Jest | 29.x | Automated unit and integration testing suite |

---

# Project Structure

```
chat application/
├── .github/
│   └── workflows/
│       └── ci.yml                 # 7-step automated GitHub Actions CI workflow
├── src/
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts  # Standardized error response formatter
│   │   └── interceptors/
│   │       └── response.interceptor.ts   # Standardized success response formatter
│   ├── config/
│   │   └── configuration.ts              # Centralized environment variable loader
│   ├── database/
│   │   ├── models/
│   │   │   ├── user.schema.ts            # Mongoose User model (password hidden)
│   │   │   ├── room.schema.ts            # Mongoose Room model with lifecycle states
│   │   │   └── room-participant.schema.ts# Mongoose RoomParticipant model with compound index
│   │   └── mongodb/
│   │       └── mongodb.module.ts         # MongoDB database connection provider
│   ├── modules/
│   │   ├── auth/                         # Authentication, JWT issuance, Passport strategy
│   │   ├── users/                        # User retrieval and profile services
│   │   ├── rooms/                        # Room CRUD, join/leave, lifecycle guards
│   │   ├── socket/                       # Socket.IO gateway, real-time events
│   │   ├── redis/                        # Redis presence and room participant operations
│   │   ├── livekit/                      # LiveKit WebRTC token generation and role validation
│   │   └── assignment-core.spec.ts       # 13 comprehensive Jest business logic tests
│   ├── app.module.ts                     # Root application module aggregating all features
│   └── main.ts                           # Bootstrap entry point, validation, and Swagger config
├── .dockerignore                         # Files excluded from Docker builds
├── .env.example                          # Environment variable template
├── DEPLOYMENT.md                         # Ubuntu/Nginx production deployment guide
├── docker-compose.yml                    # Multi-container orchestration (Backend, Mongo, Redis)
├── Dockerfile                            # Multi-stage production container build
├── package.json                          # Dependencies, build scripts, and test scripts
└── tsconfig.json                         # TypeScript compiler settings
```

---

# Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **Docker & Docker Compose**: Version 24+ (if running containerized)
- **MongoDB**: Version 6.0+ (if running locally without Docker)
- **Redis**: Version 7.0+ (if running locally without Docker)

---

# Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Application Server
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chat_app

# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=super-secure-jwt-secret-min-32-characters-long
JWT_EXPIRES_IN=7d

# LiveKit WebRTC Configuration
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_HOST=ws://localhost:7880
```

---

# Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "chat application"
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env to point to your local MongoDB and Redis instances
```

### 3. Run Development Server
```bash
npm run dev
```

The server starts at `http://localhost:3000` with Swagger UI available at `http://localhost:3000/api-docs`.

---

# Running with Docker

The application stack can be spun up in isolated containers with zero manual database configuration.

### 1. Build and Run All Containers
```bash
docker compose up --build -d
```

This starts:
- **Backend API**: Accessible at `http://localhost:3000`
- **MongoDB**: Internal port 27017 (data persisted in `mongo_data` volume)
- **Redis**: Internal port 6379 (data persisted in `redis_data` volume)

### 2. View Service Logs
```bash
docker compose logs -f backend
```

### 3. Verify Container Health
```bash
docker compose ps
```

### 4. Stop All Containers
```bash
docker compose down
```

---

# API Documentation

Interactive Swagger documentation is available at `http://localhost:3000/api-docs` with JWT Bearer authentication support.

All responses use a consistent envelope format:
- **Success (`200`/`201`)**: `{ "success": true, "data": { ... } }`
- **Error (`4xx`/`5xx`)**: `{ "success": false, "message": "...", "errorCode": "..." }`

---

## Authentication APIs

### `POST /auth/register`
Creates a new user account. Hashes password using bcrypt.
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "SecurePassword123!",
    "name": "Alice Developer"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
      "user": {
        "id": "65fc0e891234567890abcdef",
        "email": "alice@example.com",
        "name": "Alice Developer"
      }
    }
  }
  ```

### `POST /auth/login`
Validates user credentials and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
      "user": {
        "id": "65fc0e891234567890abcdef",
        "email": "alice@example.com",
        "name": "Alice Developer"
      }
    }
  }
  ```

---

## User APIs

### `GET /users/me`
Fetches the profile of the currently authenticated user.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "65fc0e891234567890abcdef",
      "email": "alice@example.com",
      "name": "Alice Developer",
      "createdAt": "2026-09-19T12:00:00.000Z"
    }
  }
  ```

---

## Room APIs

### `POST /rooms`
Creates a new collaborative room. The authenticated user is automatically designated as `host`.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "name": "Sprint Retrospective",
    "password": "optional-room-password"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "65fc0e891234567890abc999",
      "name": "Sprint Retrospective",
      "hostId": "65fc0e891234567890abcdef",
      "status": "ACTIVE",
      "participantCount": 1,
      "createdAt": "2026-09-19T12:05:00.000Z"
    }
  }
  ```

### `GET /rooms`
Lists all rooms with `status: ACTIVE`.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "65fc0e891234567890abc999",
        "name": "Sprint Retrospective",
        "hostId": "65fc0e891234567890abcdef",
        "status": "ACTIVE",
        "participantCount": 2
      }
    ]
  }
  ```

### `GET /rooms/:id`
Retrieves detailed metadata for a specific room including active participants.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "65fc0e891234567890abc999",
      "name": "Sprint Retrospective",
      "hostId": "65fc0e891234567890abcdef",
      "status": "ACTIVE",
      "participantCount": 2,
      "participants": [
        { "userId": "65fc0e891234567890abcdef", "role": "host", "status": "active" },
        { "userId": "65fc0e891234567890abc888", "role": "participant", "status": "active" }
      ]
    }
  }
  ```

### `POST /rooms/:id/join`
Allows a user to join an active room. Rejects duplicate active joins.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "password": "optional-room-password"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Successfully joined room",
      "roomId": "65fc0e891234567890abc999"
    }
  }
  ```

### `POST /rooms/:id/leave`
Allows a participant to leave a room. If the user is the **host**, the room is transitioned to `ENDED`.
- **Headers**: `Authorization: Bearer <JWT>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Successfully left room",
      "roomStatus": "ACTIVE"
    }
  }
  ```

---

## LiveKit API

### `POST /livekit/token`
Generates a cryptographically signed WebRTC token for accessing LiveKit media rooms.
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
  ```json
  {
    "roomId": "65fc0e891234567890abc999",
    "requestedRole": "participant"
  }
  ```
- **Security Check**: If a non-host requests `requestedRole: "host"`, the endpoint rejects the request with `403 Forbidden`. Only verified room hosts receive `roomAdmin: true` grants.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
      "wsUrl": "ws://localhost:7880"
    }
  }
  ```

---

# Socket.IO Events

Real-time bi-directional messaging is powered by NestJS `ChatGateway`. Handshake authentication requires a valid JWT passed in connection headers or query: `auth: { token: "Bearer <JWT>" }`.

| Event Name | Direction | Payload Schema | Purpose |
|---|---|---|---|
| `user:online` | **Server $\to$ Client** | `{ userId: string }` | Broadcast to all peers when a user authenticates on the socket. |
| `user:offline` | **Server $\to$ Client** | `{ userId: string }` | Broadcast to all peers when a user socket disconnects. |
| `room:join` | **Client $\to$ Server** | `{ roomId: string }` | Joins client to the Socket.IO room and adds them to Redis presence. |
| `participant:joined` | **Server $\to$ Client** | `{ roomId: string, userId: string, timestamp: string }` | Notifies all room members that a new user has joined the room. |
| `room:leave` | **Client $\to$ Server** | `{ roomId: string }` | Removes client from the Socket.IO room and removes them from Redis. |
| `participant:left` | **Server $\to$ Client** | `{ roomId: string, userId: string, timestamp: string }` | Notifies room members that a participant has departed. |
| `room:participant-count` | **Server $\to$ Client** | `{ roomId: string, count: number }` | Emits updated live participant count derived from Redis Set cardinality. |
| `room:status` | **Server $\to$ Client** | `{ roomId: string, status: "ACTIVE" \| "ENDED" }` | Emitted when room state changes (e.g. `ENDED` when host leaves). |
| `room:message` | **Client $\to$ Server** | `{ roomId: string, message: string }` | Submits a real-time text message to a room. |
| `room:message` | **Server $\to$ Client** | `{ roomId: string, userId: string, message: string, timestamp: string }` | Broadcasts incoming message to all members currently in the room. |

---

# MongoDB Design

Data persistence is managed via Mongoose models with strict typing and targeted indexing:

### 1. `users` Collection
- **Schema**:
  - `email`: String, required, unique, lowercase, trimmed.
  - `password`: String, required, select: false (excluded from default queries).
  - `name`: String, required.
  - `createdAt`, `updatedAt`: Timestamps.
- **Indexes**:
  - Unique Index: `{ email: 1 }` ensures $O(1)$ lookup during authentication and prevents duplicate registrations.

### 2. `rooms` Collection
- **Schema**:
  - `name`: String, required, trimmed.
  - `hostId`: ObjectId referencing `User`, required.
  - `password`: String, optional (hashed/plain for room entry gates).
  - `status`: String enum `["ACTIVE", "ENDED"]`, default `"ACTIVE"`.
  - `participantCount`: Number, default `1`.
  - `createdAt`, `updatedAt`: Timestamps.
- **Indexes**:
  - Compound Index: `{ status: 1, createdAt: -1 }` accelerates active room listings.
  - Single Field Index: `{ hostId: 1 }` optimizes host authorization lookups.

### 3. `room_participants` Collection
- **Schema**:
  - `roomId`: ObjectId referencing `Room`, required.
  - `userId`: ObjectId referencing `User`, required.
  - `role`: String enum `["host", "participant"]`.
  - `status`: String enum `["active", "left"]`.
  - `joinedAt`, `leftAt`: Timestamps.
- **Indexes**:
  - Compound Unique Index: `{ roomId: 1, userId: 1 }` guarantees atomic prevention of duplicate room joins at the database layer.
  - Single Field Index: `{ userId: 1, status: 1 }` allows rapid querying of a user's active memberships.

---

# Redis Implementation

Redis 7 serves as the centralized, in-memory real-time state engine:

### 1. User Presence Tracking
- **Key Structure**: `presence:user:<userId>`
- **Value**: `"online"`
- **TTL**: `300` seconds.
- **Lifecycle**: Refreshed whenever the user transmits an event or heartbeat ping. If a client disconnects abnormally, the key naturally expires without leaving orphaned online flags.

### 2. Room Participant Sets
- **Key Structure**: `room:<roomId>:participants`
- **Data Type**: **Redis Set** (stores unique `userId` strings).
- **Operations**:
  - `SADD room:<roomId>:participants <userId>`: Adds user on join ($O(1)$).
  - `SREM room:<roomId>:participants <userId>`: Removes user on leave ($O(1)$).
  - `SCARD room:<roomId>:participants`: Returns exact live participant count ($O(1)$).
  - `SMEMBERS room:<roomId>:participants`: Returns the complete active roster ($O(N)$).

### Why Redis is Used
1. **Sub-Millisecond Latency**: Real-time presence and roster lookups execute in < 1ms, eliminating database query spikes.
2. **Atomic Operations**: Redis set commands (`SADD`, `SREM`) provide native atomic operations that prevent race conditions when multiple users join simultaneously.
3. **Cross-Node State Synchronization**: Decouples presence state from individual Node.js processes, enabling multi-instance horizontal scaling.

---

# LiveKit Integration

LiveKit is used as a high-performance, selective forwarding unit (SFU) for WebRTC audio and video streaming.

### 1. Token Generation
- Tokens are minted using the official `livekit-server-sdk` `AccessToken` builder:
  ```typescript
  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.name,
    ttl: '6h',
  });
  ```

### 2. Participant Identity
- Each token encapsulates the user's verified MongoDB `id` as `identity` and user's full name as `name`.
- Because tokens are signed with the backend's `LIVEKIT_API_SECRET`, clients cannot forge identities.

### 3. Host vs. Participant Permissions
- Permissions are granted via LiveKit `VideoGrant`:
  - **Regular Participant**: `canPublish: true`, `canSubscribe: true`, `roomAdmin: false`.
  - **Room Host**: `canPublish: true`, `canSubscribe: true`, `roomAdmin: true` (enables muting participants, kicking peers, and ending room).
- **Security Check**: The backend verifies the requesting user against `room.hostId` in MongoDB before granting `roomAdmin`. Impostors requesting host privileges receive an immediate `403 Forbidden`.

### 4. LiveKit's Role vs. Backend's Role
- **Backend Role (Control Plane)**: Authenticates users, validates room access, handles chat text messages, verifies passwords, and issues signed WebRTC access tokens.
- **LiveKit Role (Media Plane)**: Establishes UDP/ICE connections, routes audio/video streams, adapts bitrates (simulcast), and enforces media publisher/subscriber topology.

---

# Authentication & Security

- **Password Protection**: Passwords are encrypted with `bcrypt` (10 rounds) and excluded from Mongoose schemas using `select: false`.
- **JWT Protection**: Secure symmetric HMAC-SHA256 tokens validate requests via NestJS `JwtAuthGuard`.
- **Input Validation**: Class-validator DTOs with `whitelist: true` strip arbitrary payload keys, preventing mass-assignment vulnerabilities.
- **Standardized Exception Envelope**: All runtime and validation exceptions are intercepted by `AllExceptionsFilter` to return clean, consistent `{ success: false, message, errorCode }` structures.
- **Log Sanitization**: Passwords, secrets, and API credentials are never output to console logs or error responses.

---

# Docker

The application includes a production-grade multi-stage `Dockerfile`:
- **Build Stage**: Uses `node:20-bookworm-slim`, installs devDependencies, and compiles TypeScript into `/dist`.
- **Runtime Stage**: Copies compiled JavaScript and production-only dependencies into a fresh slim container, reducing image size to ~180MB.

### Orchestration (`docker-compose.yml`)
- **Services**:
  - `backend`: Runs the compiled NestJS service on port `3000`.
  - `mongodb`: MongoDB 6.0 with volume persistence (`mongo_data`) and health check (`mongosh --eval "db.adminCommand('ping')"`).
  - `redis`: Redis 7.0 Alpine with volume persistence (`redis_data`) and health check (`redis-cli ping`).
- **Networking**: All services communicate over an isolated bridge network (`chat-network`).

---

# CI/CD

An automated Continuous Integration pipeline is implemented in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and executes on every `push` and `pull_request` to `main`, `master`, and `develop`:

1. **Checkout Code**: `actions/checkout@v4`
2. **Node.js Setup**: `actions/setup-node@v4` (Node.js 20 LTS with npm caching)
3. **Deterministic Dependency Install**: `npm ci`
4. **Code Quality Linting**: `npm run lint` (ESLint)
5. **Compilation Build**: `npm run build` (TypeScript compiler)
6. **Automated Unit Tests**: `npm test -- --ci --runInBand` (Jest unit suite)
7. **Container Image Build Verification**: `docker build -t clearlink-chat-backend:latest .`

*Note: The CI pipeline runs completely self-contained without requiring external cloud credentials or live database dependencies.*

---

# Ubuntu/Nginx Deployment

Complete architectural deployment documentation is provided in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

> **Deployment Status**: Architectural guide and specification. No live deployment to external infrastructure was performed.

### Key Deployment Highlights
- **Ubuntu Hardening**: Dedicated non-root `deployer` account, UFW firewall permitting only SSH (22), HTTP (80), and HTTPS (443), with Fail2Ban brute-force mitigation.
- **Nginx Reverse Proxy & WebSocket Upgrade**:
  - Explicit configuration for `/socket.io/` proxying with `Upgrade: $http_upgrade` and `Connection: "upgrade"`.
  - `proxy_read_timeout 86400s;` and `proxy_buffering off;` to support persistent WebSockets.
- **Automated SSL/TLS**: Let's Encrypt certificates managed via Certbot with automatic renewals.
- **Process Supervision**: Docker Compose restart policy (`restart: unless-stopped`) managed by host systemd.

---

# Scalability: 100 → 10,000+

```text
                    Load Balancer
                         |
             +-----------+-----------+
             |           |           |
          API-1       API-2       API-3
             |           |           |
             +-----------+-----------+
                         |
                       Redis
                         |
                      MongoDB

                    LiveKit
                       |
                      RTC
```

### 1. Horizontal Backend Scaling
- NestJS processes are strictly stateless. Any node can handle any REST request or WebSocket event.
- Nodes scale horizontally behind a Layer 7 load balancer (e.g. AWS ALB or Nginx).

### 2. Multi-Node Socket.IO with Redis Adapter
- Connecting `@socket.io/redis-adapter` enables cross-node room broadcasts.
- When an event is emitted on `API-1`, it is published to Redis Pub/Sub and fanned out to participants connected to `API-2` and `API-3`.

### 3. Redis Scaling (Sentinel & Cluster)
- **100 – 1,000 Users**: Single Redis instance handling ~50k ops/sec.
- **1,000 – 5,000 Users**: **Redis Sentinel** for high availability and automatic primary failover.
- **10,000+ Users**: **Redis Cluster** with sharded pub/sub (`SPUBLISH`/`SSUBSCRIBE`), keeping total memory under 50MB for 10,000 users.

### 4. MongoDB Scaling (Replica Sets & Sharding)
- B-Tree indexes on `{ email: 1 }`, `{ roomId: 1, userId: 1 }`, and `{ status: 1, createdAt: -1 }`.
- Read-heavy queries use `readPreference: secondaryPreferred` across replica set secondaries.
- High-volume collections scale horizontally via hashed sharding on `{ roomId: "hashed" }`.

### 5. LiveKit RTC Decoupling
- **Decoupled Media Plane**: Real-time WebRTC media routing involves thousands of UDP packets per second (SRTP/SRTCP). Handling this inside Node.js would saturate the single-threaded event loop.
- **10,000 Peer Bandwidth Math**:
  - 1,000 rooms $\times$ 10 participants at 1.5 Mbps per room = **~15 Gbps egress bandwidth**.
  - Media routing is handled by a dedicated cluster of 4–8 LiveKit SFU instances with 25 Gbps network interfaces, completely isolated from API nodes.

### 6. Nginx & Sticky Sessions
- Nginx uses `ip_hash;` or cookie-based affinity during the initial HTTP long-polling handshake before upgrading to WebSockets (`101 Switching Protocols`).

---

# Testing

### Automated Unit & Integration Tests
The project contains 13 automated tests covering the core business rules in `src/modules/assignment-core.spec.ts`:

```bash
npm test -- --ci --runInBand
```

**Test Coverage Summary**:
- **Authentication**: Registration, bcrypt password hashing, credential verification, and missing/invalid token rejection.
- **Room Management**: Room creation, active status assertion, duplicate join prevention, and host-leave room termination.
- **LiveKit Authorization**: Host token generation with `roomAdmin: true`, non-host impersonation rejection with `403 Forbidden`, and participant token generation with `roomAdmin: false`.

### Manual End-to-End Test Sequence
1. Register User A (`POST /auth/register`).
2. Login User A (`POST /auth/login`) and capture JWT A.
3. Register User B (`POST /auth/register`).
4. Login User B (`POST /auth/login`) and capture JWT B.
5. User A creates room (`POST /rooms`).
6. User B joins room (`POST /rooms/:id/join`).
7. Connect User A and User B via Socket.IO passing their respective JWTs.
8. User A and User B emit `room:join` with the `roomId`.
9. Verify `participant:joined` and `room:participant-count` (count: 2) received on both sockets.
10. Verify Redis contains user keys (`presence:user:<id>`) and room set (`room:<id>:participants`).
11. Request LiveKit token for User A with role `host` (succeeds with `roomAdmin: true`).
12. Request LiveKit token for User B with role `host` (fails with `403 Forbidden`).

---

# Known Limitations

1. **Persistent Chat History**: Chat messages are currently fanned out in real-time over Socket.IO and are not persisted to a MongoDB `messages` collection.
2. **Standalone LiveKit SFU**: LiveKit SFU is designed as external RTC infrastructure and is not embedded into the local Docker Compose configuration.
3. **Single Redis Node in Local Compose**: The local Docker Compose setup uses a single Redis container; multi-node Redis Sentinel or Cluster configurations are documented for production environments.

---

# Approximate Development Time

- **Total Development Duration**: ~7.5 hours
- **Breakdown**:
  - Phase 1–3 (Scaffolding, MongoDB, Auth & JWT): ~1.5 hours
  - Phase 4–6 (Rooms, Socket.IO Gateway, Redis Presence): ~2.0 hours
  - Phase 7–8 (LiveKit Tokens, Security & Error Filters): ~1.5 hours
  - Phase 9–11 (Swagger, Jest Tests, Docker, CI/CD): ~1.5 hours
  - Phase 12–14 (Production Guide, Scalability Design, Documentation): ~1.0 hour
#   c h a t - a p p l i c a t i o n  
 