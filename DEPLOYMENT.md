# Ubuntu / Production Deployment Guide

> **Note**: This document provides a production-ready architectural deployment specification for hosting the NestJS Live Chat Backend on an Ubuntu LTS server using Docker, Nginx, and Certbot. No live deployment to LVS Innovation credentials or infrastructure was performed.

---

## 1. Initial Ubuntu Server Hardening & Setup

### 1.1 Update Package Lists & Upgrade Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Create a Dedicated Non-Root Deployer User
```bash
sudo adduser deployer
sudo usermod -aG sudo deployer

# Switch to the deployer user
su - deployer
```

### 1.3 Configure Firewall (UFW)
Close all unnecessary ports and only allow SSH, HTTP, and HTTPS:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 1.4 Optional: Install Fail2Ban for SSH Brute-Force Protection
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 2. Docker & Docker Compose Installation

Install the official Docker Engine and Docker Compose plugin on Ubuntu 22.04 / 24.04:

```bash
# 1. Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# 2. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine and Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Allow deployer user to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# 6. Enable Docker service on system boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Project Deployment & Environment Configuration

### 3.1 Clone the Repository
```bash
git clone https://github.com/<YOUR_ORGANIZATION>/<YOUR_REPO>.git /home/deployer/app
cd /home/deployer/app
```

### 3.2 Configure Production Environment Variables
Create a production `.env` file on the server:
```bash
nano .env
```
Paste the production configuration:
```env
NODE_ENV=production
PORT=3005
ADMIN_PORT=3005

# Internal Docker networking hostnames
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DB_NAME=clearlink_production
MONGODB_URI=mongodb://mongodb:27017/clearlink_production

REDIS_HOST=redis
REDIS_PORT=6379

# Cryptographic secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=your_super_secure_random_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# LiveKit WebRTC credentials
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

Lock down file permissions so only the owner can read secrets:
```bash
chmod 600 .env
```

---

## 4. Running the Application via Docker Compose

### 4.1 Build & Start Containers
```bash
docker compose up -d --build
```

### 4.2 Verify Service Health
```bash
docker compose ps
```
Expected output:
```text
NAME           IMAGE            STATUS                    PORTS
chat_backend   chat-backend     Up (healthy)              0.0.0.0:3005->3005/tcp
chat_mongodb   mongo:7.0        Up (healthy)              0.0.0.0:27017->27017/tcp
chat_redis     redis:7-alpine   Up (healthy)              0.0.0.0:6379->6379/tcp
```

---

## 5. Nginx Reverse Proxy with Full WebSocket Support

Socket.IO requires persistent TCP connections that start with an HTTP handshake and upgrade to WebSockets (`Upgrade: websocket`). Without explicit Nginx proxy headers, WebSocket handshakes fail with `400 Bad Request` or fall back to short-polling.

### 5.1 Install Nginx
```bash
sudo apt install nginx -y
```

### 5.2 Configure Nginx Site
Create `/etc/nginx/sites-available/chat.conf`:
```bash
sudo nano /etc/nginx/sites-available/chat.conf
```

Paste the following configuration (replace `api.yourdomain.com` with your actual domain):

```nginx
# Upstream definition for NestJS backend
upstream nestjs_backend {
    server 127.0.0.1:3005;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Maximum file upload size
    client_max_body_size 50M;

    # 1. Socket.IO WebSocket Reverse Proxy
    location /socket.io/ {
        proxy_pass http://nestjs_backend;
        
        # Mandatory WebSocket upgrade headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard client identity headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Prevent premature WebSocket disconnection (keepalive timeout)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 2. REST API & Swagger UI Reverse Proxy
    location / {
        proxy_pass http://nestjs_backend;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 5.3 Enable Site & Test Nginx Syntax
```bash
sudo ln -s /etc/nginx/sites-available/chat.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Domain Configuration & Free SSL via Let's Encrypt (Certbot)

### 6.1 Point DNS A Record
In your DNS provider (Cloudflare, GoDaddy, AWS Route 53), add an `A` record:
- **Type**: `A`
- **Name**: `api` (or `@` for apex domain)
- **Value**: `<YOUR_UBUNTU_SERVER_IP>`
- **TTL**: 300 seconds

### 6.2 Install Certbot and Issue SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```
Follow the interactive prompt. Certbot will automatically configure HTTPS, redirect HTTP to HTTPS, and update your Nginx configuration.

### 6.3 Verify Automated Certificate Renewal
Let's Encrypt certificates expire every 90 days. Certbot installs an automatic systemd timer. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## 7. Logging, Monitoring & Restart Strategy

### 7.1 Container Logs
View live, streaming logs with timestamps:
```bash
# View all container logs
docker compose logs -f --tail=100

# Stream only backend logs
docker compose logs -f backend
```

### 7.2 Docker Log Rotation
Prevent Docker container logs from consuming disk space by configuring the default log driver in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```
Reload docker:
```bash
sudo systemctl restart docker
```

### 7.3 Basic Resource Monitoring
```bash
# Live container CPU, Memory, and Network I/O metrics
docker stats

# Host memory & CPU usage
htop

# Disk usage
df -h
```

### 7.4 Restart Strategy & High Availability
- **Container Level**: `restart: unless-stopped` in `docker-compose.yml` ensures containers restart automatically upon application crashes or fatal unhandled exceptions.
- **System Level**: `sudo systemctl enable docker` ensures that if the physical Ubuntu server reboots (e.g. cloud host kernel updates), the Docker daemon boots and restores all running containers.

