# WorkCafe Database Documentation

This document provides an overview of the database structure and setup for the WorkCafe application.

## Database Schema

The database consists of the following tables:

1. **users** - Stores user account information
2. **cafes** - Stores cafe information including location, amenities, and ratings
3. **cafe_images** - Stores images associated with cafes
4. **amenities** - Stores available amenities that cafes can have
5. **cafe_amenities** - Links cafes to their amenities (many-to-many)
6. **categories** - Stores cafe categories/tags
7. **cafe_categories** - Links cafes to their categories (many-to-many)
8. **reviews** - Stores user reviews of cafes
9. **check_ins** - Tracks user check-ins at cafes
10. **favorites** - Tracks user's favorite cafes

The database also includes these views:
- **current_occupancy** - Provides real-time occupancy data for cafes
- **cafe_rating_summary** - Provides aggregated rating data for cafes

## Setup Instructions

### Prerequisites

- PostgreSQL 12+ installed
- Database user with create database privileges

### Installation

1. Create a new PostgreSQL database:

```bash
createdb workcafe_db
```

2. Run the schema script to create tables and views:

```bash
psql -d workcafe_db -f database/schema.sql
```

3. (Optional) Run the seed script to populate initial data:

```bash
npm run db:seed
```

## Model Relationships

### Users
- A user can have many reviews
- A user can have many check-ins
- A user can have many favorite cafes

### Cafes
- A cafe can have many images
- A cafe can have many amenities (through cafe_amenities)
- A cafe can have many categories (through cafe_categories)
- A cafe can have many reviews
- A cafe can have many check-ins
- A cafe can be favorited by many users

## Database Configuration

The application connects to the database using environment variables. Copy the `.env.example` file to `.env` and update the database connection details:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=workcafe_db
DB_PASSWORD=postgres
DB_PORT=5432
```

## Sample Queries

### Get cafes with high wifi ratings

```sql
SELECT c.cafe_id, c.name, c.address, AVG(r.wifi_rating) as avg_wifi_rating
FROM cafes c
JOIN reviews r ON c.cafe_id = r.cafe_id
GROUP BY c.cafe_id, c.name, c.address
HAVING AVG(r.wifi_rating) >= 4
ORDER BY avg_wifi_rating DESC;
```

### Find cafes with current low occupancy

```sql
SELECT c.cafe_id, c.name, co.active_users, co.occupancy_percentage
FROM cafes c
JOIN current_occupancy co ON c.cafe_id = co.cafe_id
WHERE co.occupancy_percentage < 50
ORDER BY co.occupancy_percentage;
```

### Get popular cafes based on check-ins

```sql
SELECT c.cafe_id, c.name, COUNT(ci.check_in_id) AS check_in_count
FROM cafes c
JOIN check_ins ci ON c.cafe_id = ci.cafe_id
WHERE ci.check_in_time > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY c.cafe_id, c.name
ORDER BY check_in_count DESC
LIMIT 10;
```

## Data Backup and Restoration

### Backup

To create a backup of the database:

```bash
pg_dump workcafe_db > workcafe_backup.sql
```

### Restore

To restore the database from a backup:

```bash
psql -d workcafe_db -f workcafe_backup.sql
```

## Database Maintenance

It's recommended to perform regular database maintenance:

1. Run VACUUM ANALYZE periodically to optimize performance:

```sql
VACUUM ANALYZE;
```

2. Set up regular backups using cron jobs or similar scheduler.

3. Monitor database size and performance using queries like:

```sql
SELECT pg_size_pretty(pg_database_size('workcafe_db'));
```

## Database Schema Diagram

```
users(PK:user_id) ---< reviews(FK:user_id, PK:review_id) >--- cafes(PK:cafe_id)
                   ---< check_ins(FK:user_id, PK:check_in_id) >--- 
                   ---< favorites(FK:user_id, PK:user_id+cafe_id) >---

cafes(PK:cafe_id) ---< cafe_images(FK:cafe_id, PK:image_id)
                  ---< cafe_amenities(FK:cafe_id, PK:cafe_id+amenity_id) >--- amenities(PK:amenity_id)
                  ---< cafe_categories(FK:cafe_id, PK:cafe_id+category_id) >--- categories(PK:category_id)
```

## Troubleshooting

### Connection Issues

If you encounter connection issues, verify:
- PostgreSQL service is running
- Database credentials are correct in your .env file
- Network access to the database is available

### Performance Issues

If queries are slow:
- Ensure indexes are created on frequently queried columns
- Review and optimize complex queries
- Increase connection pool size if needed in database/config.js
