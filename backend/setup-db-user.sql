-- setup-db-user.sql
-- Create a new database user with password from .env
-- Run this in pgAdmin or psql if you can connect

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'dbuser') THEN
        CREATE USER dbuser WITH PASSWORD '1234';
        ALTER USER dbuser CREATEDB;
        GRANT ALL PRIVILEGES ON DATABASE postgres TO dbuser;
    ELSE
        ALTER USER dbuser WITH PASSWORD '1234';
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE blockscan'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'blockscan')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE blockscan TO dbuser;

-- Also update postgres user password
ALTER USER postgres WITH PASSWORD '1234';

