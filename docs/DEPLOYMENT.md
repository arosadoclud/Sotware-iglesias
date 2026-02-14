# 🚀 Guía de Despliegue

Guía completa para desplegar Church Manager v4 en producción.

## 📋 Tabla de Contenidos

- [Consideraciones Previas](#consideraciones-previas)
- [Despliegue en VPS](#despliegue-en-vps)
- [Despliegue en Docker](#despliegue-en-docker)
- [Despliegue Cloud](#despliegue-cloud)
- [Configuración de Dominio](#configuración-de-dominio)
- [SSL/HTTPS](#sslhttps)
- [Respaldos](#respaldos)
- [Monitoreo](#monitoreo)

---

## Consideraciones Previas

### Recursos Mínimos Recomendados

| Componente | Desarrollo | Producción Pequeña | Producción Grande |
|------------|------------|-------------------|-------------------|
| CPU        | 2 cores    | 2-4 cores         | 4-8 cores         |
| RAM        | 4 GB       | 8 GB              | 16+ GB            |
| Disco      | 10 GB      | 50 GB SSD         | 100+ GB SSD       |
| Usuarios   | 1-10       | 100-500           | 500+              |

### Checklist Pre-Despliegue

- [ ] Dominio configurado
- [ ] Certificado SSL preparado
- [ ] Variables de entorno de producción configuradas
- [ ] Base de datos MongoDB configurada
- [ ] Redis instalado (si se usa)
- [ ] Servicios externos configurados (Email, WhatsApp)
- [ ] Backups automatizados configurados
- [ ] Monitoreo configurado

---

## Despliegue en VPS

### Opción 1: DigitalOcean / Linode / Vultr

#### 1. Crear Droplet/VPS

```bash
# Ubuntu 22.04 LTS
# Mínimo: 2 CPU, 4GB RAM, 50GB SSD
```

#### 2. Configuración Inicial

```bash
# Conectar por SSH
ssh root@tu-servidor-ip

# Actualizar sistema
apt update && apt upgrade -y

# Crear usuario no-root
adduser churchmanager
usermod -aG sudo churchmanager

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Cambiar a usuario nuevo
su - churchmanager
```

#### 3. Instalar Dependencias

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Redis
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Nginx
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# PM2
sudo npm install -g pm2
```

#### 4. Clonar y Configurar Proyecto

```bash
# Clonar repositorio
cd /home/churchmanager
git clone https://github.com/arosadoclud/Sotware-iglesias.git
cd Sotware-iglesias

# Backend
cd backend
npm install --production
cp .env.example .env
nano .env  # Configurar variables de producción

# Compilar TypeScript
npm run build

# Frontend
cd ../frontend
npm install
nano .env  # Configurar VITE_API_URL con tu dominio
npm run build
```

#### 5. Configurar Variables de Entorno (Producción)

```env
# backend/.env
NODE_ENV=production
PORT=5000

# MongoDB (producción con autenticación)
MONGODB_URI=mongodb://churchuser:password@localhost:27017/church_manager?authSource=admin

# JWT (generar secretos seguros)
JWT_SECRET=tu_secreto_super_seguro_64_caracteres_minimo_aleatorio
JWT_REFRESH_SECRET=otro_secreto_diferente_64_caracteres_aleatorio
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# CORS (tu dominio)
CORS_ORIGIN=https://tudominio.com

# Email (usar servicio real)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_api_key_de_sendgrid
EMAIL_FROM=noreply@tudominio.com

# WhatsApp (Twilio producción)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_token_produccion
TWILIO_WHATSAPP_NUMBER=+14155238886

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_secret
```

#### 6. Configurar MongoDB con Autenticación

```bash
# Entrar a MongoDB
mongosh

# Crear usuario administrador
use admin
db.createUser({
  user: "admin",
  pwd: "password_super_seguro",
  roles: ["root"]
})

# Crear usuario para la aplicación
use church_manager
db.createUser({
  user: "churchuser",
  pwd: "password_seguro_diferente",
  roles: ["readWrite"]
})

# Salir
exit

# Habilitar autenticación
sudo nano /etc/mongod.conf

# Agregar:
security:
  authorization: enabled

# Reiniciar MongoDB
sudo systemctl restart mongod
```

#### 7. Iniciar Backend con PM2

```bash
cd /home/churchmanager/Sotware-iglesias/backend

# Iniciar con PM2
pm2 start dist/server.js --name church-backend

# Configurar inicio automático
pm2 startup systemd
pm2 save

# Ver logs
pm2 logs church-backend

# Monitorear
pm2 monit
```

#### 8. Configurar Nginx

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/church-manager
```

```nginx
# Frontend (React)
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /home/churchmanager/Sotware-iglesias/frontend/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend (proxy)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket (Socket.io)
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Seguridad headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/church-manager /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## Despliegue en Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: church-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: church_manager
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    networks:
      - church-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: church-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - church-network

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: church-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://churchuser:${MONGO_USER_PASSWORD}@mongodb:27017/church_manager?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - church-network
    volumes:
      - ./backend/uploads:/app/uploads

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: church-frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - church-network
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl

networks:
  church-network:
    driver: bridge

volumes:
  mongodb_data:
  redis_data:
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Desplegar con Docker

```bash
# Crear archivo .env
cat > .env << EOF
MONGO_ROOT_PASSWORD=password_super_seguro
MONGO_USER_PASSWORD=password_usuario
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
EOF

# Construir y levantar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Actualizar
git pull
docker-compose up -d --build
```

---

## Despliegue Cloud

### Heroku

#### 1. Preparar Aplicación

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear app
heroku create church-manager-app
```

#### 2. Configurar MongoDB (MongoDB Atlas)

```bash
# Agregar MongoDB Atlas como addon o usar conexión externa
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/church_manager"
```

#### 3. Configurar Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

#### 4. Deploy

```bash
git push heroku main
```

### Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Configurar variables de entorno en dashboard
# VITE_API_URL=https://tu-backend.herokuapp.com/api/v1
```

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar
railway init

# Deploy
railway up
```

---

## SSL/HTTPS

### Opción 1: Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

### Opción 2: Cloudflare

1. Agregar dominio a Cloudflare
2. Actualizar nameservers
3. Habilitar SSL/TLS (Full)
4. Configurar Page Rules para caching

---

## Respaldos

### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/churchmanager/backups"
MONGO_USER="admin"
MONGO_PASS="password"

# Crear directorio
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --username $MONGO_USER \
          --password $MONGO_PASS \
          --authenticationDatabase admin \
          --out $BACKUP_DIR/mongo_$DATE

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/churchmanager/Sotware-iglesias/backend/uploads

# Eliminar backups antiguos (> 30 días)
find $BACKUP_DIR -name "mongo_*" -mtime +30 -exec rm -rf {} \;
find $BACKUP_DIR -name "uploads_*" -mtime +30 -delete

echo "Backup completado: $DATE"
```

### Configurar Cron

```bash
# Editar crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * /home/churchmanager/backup.sh >> /home/churchmanager/backup.log 2>&1
```

---

## Monitoreo

### PM2 Monitoring

```bash
# Habilitar monitoring de PM2
pm2 install pm2-logrotate

# Configurar alertas
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Uptime Monitoring

Servicios recomendados:
- **UptimeRobot** (gratuito)
- **Pingdom**
- **StatusCake**

### Logs

```bash
# Ver logs de PM2
pm2 logs

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

---

## Checklist Post-Despliegue

- [ ] Aplicación accesible via HTTPS
- [ ] Base de datos con respaldos automáticos
- [ ] Monitoreo configurado
- [ ] SSL certificate válido
- [ ] Variables de entorno seguras
- [ ] Logs rotando correctamente
- [ ] PM2 reiniciando automáticamente
- [ ] Firewall configurado
- [ ] Dominio apuntando correctamente
- [ ] Email de notificaciones funcionando
- [ ] WhatsApp funcionando (si aplica)
- [ ] Uploads/PDFs funcionando

---

## Troubleshooting

### Aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs church-backend --lines 100

# Verificar variables de entorno
pm2 env 0

# Reiniciar
pm2 restart church-backend
```

### MongoDB Connection Issues

```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Probar conexión
mongosh "mongodb://churchuser:pass@localhost:27017/church_manager?authSource=admin"
```

### Nginx Issues

```bash
# Probar configuración
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

---

## Actualizaciones

### Actualizar Aplicación

```bash
cd /home/churchmanager/Sotware-iglesias

# Pull cambios
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart church-backend

# Frontend
cd ../frontend
npm install
npm run build

# Limpiar cache de Nginx
sudo systemctl reload nginx
```

---

## Seguridad

### Recomendaciones

1. **Firewall**: Solo puertos necesarios abiertos
2. **SSH**: Usar llaves, deshabilitar login root
3. **MongoDB**: Autenticación habilitada, bind a localhost
4. **Redis**: Contraseña configurada
5. **SSL**: Certificado válido, HSTS habilitado
6. **Backups**: Automáticos y probados
7. **Updates**: Sistema operativo actualizado
8. **Monitoring**: Alertas configuradas

---

## Soporte

¿Problemas con el despliegue?

- **Issues**: https://github.com/arosadoclud/Sotware-iglesias/issues
- **Email**: arosadoclud@gmail.com

---

¡Felicitaciones! Tu aplicación está en producción. 🎉
