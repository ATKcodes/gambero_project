# Database Cleanup Scripts

This directory contains utility scripts for cleaning and maintaining the database for the Job Consultation application.

## Cleanup Script

The `cleanup.js` script provides an interactive menu for performing various database cleanup and standardization tasks.

### Features

- **User Cleanup**: Delete users authenticated with 42 or all users in the system
- **Job Request Cleanup**: Delete job requests based on their status (open, assigned, completed, cancelled)
- **Message Cleanup**: Delete all messages in the system
- **Expertise Standardization**: Standardize expertise areas across all sellers and job requests

### Running the Script

1. Navigate to the backend directory:
   ```
   cd job-consultation-app/backend
   ```

2. Run the script with Node.js:
   ```
   node scripts/cleanup.js
   ```

3. Follow the interactive menu prompts to perform the desired cleanup operations

### Standardized Expertise Areas

The application now uses the following standardized expertise areas:

1. Pastry
2. Vegetarian
3. Italian
4. Meats and fishes
5. Wines

The standardization script will automatically update any non-standard values in the database.

## Warning

These scripts perform destructive operations on your database. Use them with caution, especially in production environments. Always ensure you have a backup of your data before running cleanup operations.

## Scheduled Cleanup

If you want to schedule regular cleanup operations, you can set up a cron job to run specific cleanup functions. For example, to clean up completed jobs every week:

1. Create a specific script that only calls the cleanup jobs function
2. Schedule it with cron to run weekly

## Troubleshooting

If you encounter connection issues, verify that:
1. MongoDB is running
2. Your `.env` file contains the correct `MONGO_URI` value
3. Network connectivity and firewall settings allow the connection 