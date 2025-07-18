# Thirupugazh Song List Generator - Setup Instructions

## Prerequisites
- Node.js (installed ✓)
- MySQL Server (running as service ✓)
- npm dependencies (installed ✓)

## Environment Configuration

Create a `.env` file in the project root with the following content:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=thirupugazh_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Server Configuration
PORT=3000
NODE_ENV=development

# LLM API Configuration (for AI chatbot functionality)
LLM_API_KEY=your_llm_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-3.5-turbo

# Security Configuration
SECRET_KEY=thirupugazh_secret_key_2024

# Application Configuration
MAX_PLAYLIST_DURATION=300
HISTORY_LOOKBACK_DAYS=30
```

## Database Setup

1. **Connect to MySQL** using your preferred method:
   - MySQL Workbench
   - phpMyAdmin
   - Command line (if mysql is in PATH)
   - Any MySQL client

2. **Run the database setup script** (`database_setup.sql`):
   ```sql
   -- Create database
   CREATE DATABASE IF NOT EXISTS thirupugazh_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Use the database
   USE thirupugazh_db;
   
   -- Create playlist_history table
   CREATE TABLE IF NOT EXISTS playlist_history (
       id INT AUTO_INCREMENT PRIMARY KEY,
       song_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_song_id (song_id),
       INDEX idx_created_at (created_at)
   );
   ```

3. **Verify the setup**:
   ```sql
   USE thirupugazh_db;
   SHOW TABLES;
   DESCRIBE playlist_history;
   ```

## Quick Start

1. **Update .env file** with your MySQL credentials
2. **Run database setup** as described above
3. **Start the application**:
   ```bash
   npm start
   ```
4. **Open browser** and navigate to `http://localhost:3000`

## Testing Database Connection

The server will automatically test the database connection on startup and display the status in the console.

## Troubleshooting

### MySQL Connection Issues
- Verify MySQL service is running
- Check DB_USER and DB_PASSWORD in .env
- Ensure the database `thirupugazh_db` exists
- Check MySQL port (default: 3306)

### Port Issues
- Default port is 3000
- Change PORT in .env if needed
- Ensure no other service is using the port

## Next Steps

Once setup is complete:
1. Test playlist generation
2. Configure LLM API for chatbot (optional)
3. Test PDF export functionality 