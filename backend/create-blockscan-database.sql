-- create-blockscan-database.sql
-- Run this script in pgAdmin to create the 'blockscan' database
-- Connect to PostgreSQL server, then run this script

-- Create the new database
CREATE DATABASE blockscan;

-- Grant privileges to dbuser (if it exists)
GRANT ALL PRIVILEGES ON DATABASE blockscan TO dbuser;

-- Grant privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE blockscan TO postgres;

-- Note: After creating the database, you need to:
-- 1. Connect to the 'blockscan' database in pgAdmin
-- 2. Run the database-schema.sql file to create all tables





