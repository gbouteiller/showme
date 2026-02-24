#!/bin/bash

# Convex PostgreSQL Migration - Quick Start
# Run this script to migrate from SQLite to PostgreSQL in one command

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Convex SQLite → PostgreSQL Migration Assistant      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not installed"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    exit 1
fi

print_success "Prerequisites met"

# Backup current state
print_step "Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp docker-compose.yml "$BACKUP_DIR/"

# Check if containers are running
if docker ps | grep -q "showme-backend-1\|effex-backend"; then
    print_warning "Backend is currently running"
    read -p "Stop containers now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down
        print_success "Containers stopped"
    else
        print_error "Migration cancelled - containers must be stopped first"
        exit 1
    fi
fi

# Setup environment
print_step "Setting up environment..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from example"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_warning ".env already exists, keeping current configuration"
fi

# Generate INSTANCE_SECRET if not present
if ! grep -q "INSTANCE_SECRET=" .env || grep -q "INSTANCE_SECRET=$" .env; then
    if command_exists openssl; then
        SECRET=$(openssl rand -hex 32)
        if grep -q "INSTANCE_SECRET=" .env; then
            sed -i.bak "s/INSTANCE_SECRET=.*/INSTANCE_SECRET=$SECRET/" .env && rm -f .env.bak
        else
            echo "INSTANCE_SECRET=$SECRET" >> .env
        fi
        print_success "Generated INSTANCE_SECRET"
    else
        print_warning "openssl not found, please manually set INSTANCE_SECRET in .env"
    fi
fi

# Show configuration
print_step "Current configuration:"
echo ""
grep -E "^(POSTGRES_PASSWORD|INSTANCE_NAME|INSTANCE_SECRET)" .env | while read line; do
    if [[ $line == INSTANCE_SECRET=* ]]; then
        echo "  INSTANCE_SECRET=****[hidden]****"
    else
        echo "  $line"
    fi
done
echo ""

read -p "Does this look correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please edit .env file and run again"
    exit 1
fi

# Start PostgreSQL
print_step "Starting PostgreSQL..."
docker compose up -d postgres

# Wait for PostgreSQL to be ready
print_step "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose ps postgres | grep -q "healthy"; then
        print_success "PostgreSQL is ready"
        break
    fi
    echo -n "."
    sleep 1
done

if ! docker compose ps postgres | grep -q "healthy"; then
    print_error "PostgreSQL failed to start"
    docker compose logs postgres
    exit 1
fi

# Start backend
print_step "Starting Convex backend..."
docker compose up -d backend

# Wait for backend
print_step "Waiting for backend to be ready..."
for i in {1..30}; do
    if docker compose ps backend | grep -q "healthy"; then
        print_success "Backend is ready"
        break
    fi
    echo -n "."
    sleep 1
done

# Start dashboard
print_step "Starting Dashboard..."
docker compose up -d dashboard
sleep 5

# Check final status
print_step "Checking final status..."
echo ""
docker compose ps
echo ""

# Memory check
print_step "Memory usage check:"
echo ""
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "(NAME|postgres|backend)"
echo ""

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Migration Complete! ✓                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo "  View logs:        docker compose logs -f"
echo "  Check memory:     docker stats --no-stream"
echo "  Stop:             docker compose down"
echo "  Start:            docker compose up -d"
echo ""
echo -e "${BLUE}Test your app:${NC}"
echo "  bun dev"
echo ""
echo -e "${YELLOW}Backup location:${NC} $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Memory should now be ~1-2GB instead of 8GB${NC}"
echo ""
