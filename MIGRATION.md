# Convex PostgreSQL Migration Guide

This guide will help you migrate your Convex self-hosted backend from SQLite to PostgreSQL to reduce memory usage from ~8GB to ~1-2GB.

## Why PostgreSQL?

**Current SQLite Issues:**
- Uses 8GB+ RAM for 85k documents (memory-mapped I/O)
- Uncontrollable memory growth via OS file caching
- Loads entire database into RAM for performance

**PostgreSQL Benefits:**
- Configurable memory limits (512MB-1GB cache vs 8GB)
- Better concurrent write performance
- Production-ready scalability
- Predictable resource usage

## Prerequisites

- Docker and Docker Compose installed
- Current Convex backend running with SQLite
- `openssl` installed (for generating secrets)
- About 10 minutes downtime for migration

## Quick Start

### 1. Run the Migration Preparation Script

```bash
cd /path/to/your/project
./scripts/migrate-to-postgres.sh
```

This will:
- Create a backup of your SQLite database
- Check your configuration
- Generate required secrets

### 2. Stop Current Containers

```bash
docker compose down
```

### 3. Configure Environment Variables

Create/update your `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit with your preferred editor
nano .env  # or vim, code, etc.
```

Required variables:
- `POSTGRES_PASSWORD` - Change from default for security
- `INSTANCE_SECRET` - Will be auto-generated if missing

### 4. Start PostgreSQL

```bash
# Start just PostgreSQL first
docker compose up -d postgres

# Wait for it to be healthy (check logs)
docker compose logs -f postgres

# Should see: "database system is ready to accept connections"
```

### 5. Start Convex Backend

```bash
# Start backend and dashboard
docker compose up -d backend dashboard

# Check logs
docker compose logs -f backend
```

### 6. Verify Migration

```bash
# Check memory usage (should be 1-2GB now)
docker stats --no-stream

# Expected output:
# showme-backend-1     1.2GiB / 23.49GiB   (down from 8GB)
# postgres-1          ~600MiB
```

### 7. Test Your Application

```bash
bun dev
```

Navigate to your app and verify:
- Data loads correctly
- Queries work as expected
- Real-time updates function

## Configuration Details

### Memory Configuration

The PostgreSQL service is configured with these memory limits:

```yaml
# PostgreSQL settings
shared_buffers: 512MB          # Main data cache (was unlimited with SQLite)
effective_cache_size: 1GB      # OS cache estimate
work_mem: 16MB                 # Per-query memory
maintenance_work_mem: 128MB    # Maintenance operations
max_connections: 20            # Limit concurrent connections

# Docker limits
memory: 2g                     # Hard container limit
memory: 512m                   # Reserved memory
```

This targets **1-2GB total memory usage** instead of 8GB.

### Backend Memory Limits

```yaml
# Backend container limits
memory: 3g                     # Upper limit for safety
memory: 1g                     # Reserved memory
```

## Data Migration Options

### Option 1: Fresh Start (Recommended for Development)

If you can recreate your data:

```bash
# Just start with empty PostgreSQL
docker compose up -d
# Your app will recreate data as needed
```

### Option 2: Export/Import via Convex CLI

```bash
# Export from old SQLite backend
npx convex export --path ./backup

# After migration, import to PostgreSQL
npx convex import --path ./backup
```

### Option 3: Manual Data Migration (Advanced)

If you need precise migration:

1. Export SQLite data to SQL:
```bash
sqlite3 db.sqlite3 .dump > dump.sql
```

2. Convert and import to PostgreSQL (requires schema adjustments)

## Rollback Instructions

If something goes wrong:

```bash
# 1. Stop all containers
docker compose down

# 2. Restore original docker-compose.yml
git checkout docker-compose.yml

# 3. Remove PostgreSQL data (optional - destroys data)
docker volume rm effex_postgres_data

# 4. Start with SQLite again
docker compose up -d
```

Your SQLite data remains in the `data` volume until you explicitly delete it.

## Troubleshooting

### Issue: Backend can't connect to PostgreSQL

**Symptoms:** Backend container keeps restarting

**Solution:**
```bash
# Check PostgreSQL is healthy
docker compose ps

# Check logs
docker compose logs postgres

# Verify POSTGRES_URL matches credentials in docker-compose.yml
```

### Issue: High memory still

**Symptoms:** Still seeing 6GB+ usage

**Check:**
```bash
# Is PostgreSQL actually being used?
docker exec showme-postgres-1 psql -U convex -c "\dt"

# Should show tables. If not, backend might still be using SQLite
```

### Issue: Data not found

**Symptoms:** App loads but no data

**Solution:**
- Did you export/import data before migration?
- Check if backend created new database schema:
```bash
docker exec showme-postgres-1 psql -U convex -d convex_self_hosted -c "SELECT COUNT(*) FROM documents;"
```

## Performance Comparison

| Metric | SQLite | PostgreSQL | Change |
|--------|--------|------------|--------|
| **Memory Usage** | 8GB | 1-2GB | **-75%** |
| **Cold Start** | Fast | Slower | Slight increase |
| **Concurrent Writes** | Poor | Good | **Improved** |
| **Read Latency** | Very Low | Low | Slight increase |
| **Cache Control** | None | Configurable | **Better** |

## Monitoring

Monitor memory usage over time:

```bash
# Watch memory every 5 seconds
watch -n 5 'docker stats --no-stream'

# Check PostgreSQL memory specifically
docker exec showme-postgres-1 psql -U convex -c "
SELECT
  pg_size_pretty(pg_total_memory_usage()::bigint);
"
```

## Next Steps

After successful migration:

1. **Update your CI/CD** to use the new docker-compose.yml
2. **Document the change** for your team
3. **Set up monitoring** for PostgreSQL memory
4. **Consider backups** - PostgreSQL needs different backup strategy than SQLite file copy

## Support

- [Convex Self-Hosting Docs](https://docs.convex.dev/self-hosting)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Convex Discord #self-hosted channel](https://convex.dev/community)

## Files Changed

- `docker-compose.yml` - Added PostgreSQL service, memory limits
- `.env.example` - New environment variables
- `scripts/migrate-to-postgres.sh` - Migration helper script
