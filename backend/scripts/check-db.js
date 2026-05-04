// check-db.js - Database connection checker
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Checking database connection...\n');
console.log('Configuration:');
console.log(`  Host: ${process.env.PG_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.PG_PORT || 5432}`);
console.log(`  User: ${process.env.PG_USER || 'postgres'}`);
console.log(`  Database: ${process.env.PG_DATABASE || 'test'}\n`);

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: 'postgres', // Connect to default postgres DB first
  connectionTimeoutMillis: 5000,
});

pool.connect()
  .then(async (client) => {
    console.log('✅ Connected to PostgreSQL server!\n');
    
    // Check if database exists
    const dbCheck = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [process.env.PG_DATABASE]
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`✅ Database "${process.env.PG_DATABASE}" exists\n`);
      client.release();
      
      // Test connection to the actual database
      const testPool = new Pool({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
      });
      
      return testPool.connect()
        .then((testClient) => {
          console.log(`✅ Successfully connected to database "${process.env.PG_DATABASE}"`);
          testClient.release();
          testPool.end();
          process.exit(0);
        })
        .catch((err) => {
          console.error(`❌ Failed to connect to database "${process.env.PG_DATABASE}":`, err.message);
          testPool.end();
          process.exit(1);
        });
    } else {
      console.log(`❌ Database "${process.env.PG_DATABASE}" does NOT exist\n`);
      console.log('To create the database, run:');
      console.log(`  CREATE DATABASE ${process.env.PG_DATABASE};`);
      client.release();
      pool.end();
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ Connection failed!\n');
    console.error('Error:', err.message);
    console.error('Code:', err.code, '\n');
    
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 PostgreSQL is not running or not accessible.\n');
      console.log('To start PostgreSQL on Windows:');
      console.log('  1. Open Services (services.msc)');
      console.log('  2. Find "postgresql-x64-XX" service');
      console.log('  3. Right-click and select "Start"\n');
      console.log('Or use command line:');
      console.log('  net start postgresql-x64-XX\n');
      console.log('Alternative: Check if PostgreSQL is installed and running on a different port.');
    } else if (err.code === '28P01') {
      console.log('💡 Authentication failed. Check your username and password in .env file.');
    } else if (err.code === '3D000') {
      console.log('💡 Database does not exist. Create it first.');
    }
    
    pool.end();
    process.exit(1);
  });

