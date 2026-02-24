#!/bin/bash

# Convex SQLite to PostgreSQL Migration Script
# This script helps migrate your Convex data from SQLite to PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Convex SQLite to PostgreSQL Migration ===${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the directory containing docker-compose.yml"
    exit 1
fi

# Step 1: Backup existing SQLite data
echo -e "${YELLOW}Step 1: Creating backup of SQLite database...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if docker ps | grep -q showme-backend-1; then
    echo "Stopping backend container to ensure data consistency..."
    docker stop showme-backend-1
    
    # Copy SQLite database
    if docker cp showme-backend-1:/convex/data/db.sqlite3 "$BACKUP_DIR/" 2>/dev/null; then
        echo -e "${GREEN}✓ SQLite database backed up to $BACKUP_DIR/db.sqlite3${NC}"
    else
        echo -e "${YELLOW}⚠ Could not copy database from container, checking local volume...${NC}"
        # Try to find the volume
        VOLUME_PATH=$(docker volume inspect --format '{{ .Mountpoint }}' "$(basename $(pwd))_data" 2>/dev/null || echo "")
        if [ -n "$VOLUME_PATH" ] && [ -f "$VOLUME_PATH/db.sqlite3" ]; then
            cp "$VOLUME_PATH/db.sqlite3" "$BACKUP_DIR/"
            echo -e "${GREEN}✓ SQLite database backed up from volume${NC}"
        else
            echo -e "${RED}✗ Could not find SQLite database to backup${NC}"
            echo "Continuing anyway..."
        fi
    fi
    
    # Restart backend for now
    docker start showme-backend-1
else
    echo -e "${YELLOW}⚠ Backend container not running, skipping live backup${NC}"
fi

echo ""

# Step 2: Export data using Convex CLI
echo -e "${YELLOW}Step 2: Exporting Convex data...${NC}"
echo "Note: Make sure you have CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY set in your environment"

if [ -z "$CONVEX_SELF_HOSTED_URL" ] || [ -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
    echo -e "${YELLOW}⚠ Convex environment variables not set${NC}"
    echo "Please ensure these are set in your .env.local or environment:"
    echo "  - CONVEX_SELF_HOSTED_URL"
    echo "  - CONVEX_SELF_HOSTED_ADMIN_KEY"
    echo ""
    echo "Continuing with manual migration steps..."
else
    # Try to export using convex CLI
    echo "Attempting to export data using 'npx convex export'..."
    if command -v npx &> /dev/null; then
        npx convex export --path "$BACKUP_DIR/convex_export" || echo -e "${YELLOW}⚠ Export command failed, continuing...${NC}"
    else
        echo -e "${YELLOW}⚠ npx not found, skipping automated export${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Backup completed: $BACKUP_DIR${NC}"
echo ""

# Step 3: Generate instance secret if not set
echo -e "${YELLOW}Step 3: Checking configuration...${NC}"
if [ -f ".env" ]; then
    source .env
fi

if [ -z "$INSTANCE_SECRET" ]; then
    echo "Generating new INSTANCE_SECRET..."
    if command -v openssl &> /dev/null; then
        NEW_SECRET=$(openssl rand -hex 32)
        echo "INSTANCE_SECRET=$NEW_SECRET" >> .env
        echo -e "${GREEN}✓ INSTANCE_SECRET generated and added to .env${NC}"
    else
        echo -e "${RED}✗ openssl not found. Please manually generate a secret:${NC}"
        echo "  openssl rand -hex 32"
        echo "Then add it to your .env file as INSTANCE_SECRET"
    fi
else
    echo -e "${GREEN}✓ INSTANCE_SECRET already configured${NC}"
fi

echo ""

# Step 4: Migration instructions
echo -e "${GREEN}=== Migration Preparation Complete ===${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. ${YELLOW}Stop current containers:${NC}"
echo "   docker compose down"
echo ""
echo "2. ${YELLOW}Update your .env file:${NC}"
echo "   cp .env.example .env"
echo "   # Edit .env and set POSTGRES_PASSWORD and INSTANCE_SECRET"
echo ""
echo "3. ${YELLOW}Start PostgreSQL and backend:${NC}"
echo "   docker compose up -d postgres"
echo "   # Wait for postgres to be healthy (about 10 seconds)"
echo "   docker compose up -d backend dashboard"
echo ""
echo "4. ${YELLOW}Verify the migration:${NC}"
echo "   docker stats --no-stream"
echo "   # Check that memory usage is now 1-2GB instead of 8GB"
echo ""
echo "5. ${YELLOW}Test your application:${NC}"
echo "   bun dev"
echo ""
echo "${YELLOW}Rollback (if needed):${NC}"
echo "   docker compose down"
echo "   # Restore docker-compose.yml from git or backup"
echo "   # Remove postgres_data volume if you want to start fresh:"
echo "   docker volume rm $(basename $(pwd))_postgres_data"
echo "   docker compose up -d"
echo ""
echo -e "${GREEN}Backup location: $BACKUP_DIR${NC}"
echo ""
