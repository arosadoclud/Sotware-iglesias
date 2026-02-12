#!/bin/bash

# ============================================
# Setup Script - Church Program Manager
# ============================================

echo "=================================================="
echo "🚀 Church Program Manager - Setup Automático"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js >= 20.0.0 desde: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js versión $NODE_VERSION detectada. Se requiere >= 20${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) instalado${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) instalado${NC}"
echo ""

# Ir a la carpeta backend
cd backend

# Instalar dependencias
echo -e "${BLUE}📦 Instalando dependencias...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Copiar .env
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edita el archivo .env con tu configuración${NC}"
    echo ""
    echo "Debes configurar:"
    echo "  - MONGODB_URI (tu conexión a MongoDB)"
    echo "  - JWT_SECRET (genera uno seguro)"
    echo "  - JWT_REFRESH_SECRET (genera uno diferente)"
    echo ""
else
    echo -e "${YELLOW}⚠️  El archivo .env ya existe, no se sobrescribirá${NC}"
    echo ""
fi

# Verificar MongoDB
echo -e "${BLUE}Verificando MongoDB...${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB instalado localmente${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB no detectado localmente${NC}"
    echo "Puedes usar:"
    echo "  1. Instalar MongoDB localmente"
    echo "  2. Usar MongoDB Atlas (recomendado): https://www.mongodb.com/cloud/atlas"
fi
echo ""

# Resumen final
echo "=================================================="
echo -e "${GREEN}✅ Setup completado${NC}"
echo "=================================================="
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Edita el archivo .env con tu configuración"
echo "   ${BLUE}nano .env${NC}  o  ${BLUE}code .env${NC}"
echo ""
echo "2. Inicia el servidor en modo desarrollo"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Verifica que funciona"
echo "   ${BLUE}curl http://localhost:5000/health${NC}"
echo ""
echo "=================================================="
echo "📚 Documentación: README.md"
echo "🚀 Happy coding!"
echo "=================================================="
