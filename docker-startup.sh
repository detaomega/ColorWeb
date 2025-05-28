#!/bin/bash
# docker-startup.sh - Completely rewritten for reliability
# This script orchestrates the startup process: wait for MongoDB, import data, then start the server

set -e  # Exit on any error

echo "🚀 Starting application setup process..."

# Colors for better output readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to wait for MongoDB to be ready
wait_for_mongodb() {
    echo -e "${BLUE}⏳ Waiting for MongoDB to be ready...${NC}"
    
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        echo -e "${YELLOW}Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking MongoDB connection...${NC}"
        
        if node -e "
            const mongoose = require('mongoose');
            mongoose.connect('$MONGO_URL', { 
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 3000 
            })
            .then(() => {
                console.log('MongoDB is ready!');
                process.exit(0);
            })
            .catch(() => {
                process.exit(1);
            });
        " 2>/dev/null; then
            echo -e "${GREEN}✅ MongoDB is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}MongoDB not ready yet, waiting 2 seconds...${NC}"
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    echo -e "${RED}❌ MongoDB failed to become ready within timeout period${NC}"
    exit 1
}

# Function to check if we should import data
# Returns 0 if should import, 1 if should skip
should_import_data() {
    echo -e "${BLUE}🔍 Checking if data already exists in database...${NC}"
    
    # Create a simple Node.js script that exits with different codes
    # Exit code 0 = no data found (should import)
    # Exit code 1 = data found (should skip)
    # Exit code 2 = error checking
    
    node -e "
        const mongoose = require('mongoose');
        const Question = require('./db_structures/question');
        
        mongoose.connect('$MONGO_URL')
        .then(async () => {
            const count = await Question.countDocuments();
            console.log('Found ' + count + ' questions in database');
            
            if (count === 0) {
                console.log('Database is empty - will import data');
                process.exit(0);  // Should import
            } else {
                console.log('Database has data - will skip import');
                process.exit(1);  // Should skip
            }
        })
        .catch((error) => {
            console.log('Error checking database: ' + error.message);
            process.exit(2);  // Error
        });
    " 2>/dev/null
    
    # Check the exit code from the Node.js script
    local EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${YELLOW}📥 No existing data found. Will attempt to import dataset...${NC}"
        return 0  # Should import
    elif [ $EXIT_CODE -eq 1 ]; then
        echo -e "${GREEN}✅ Found existing questions in database. Skipping import.${NC}"
        return 1  # Should skip
    else
        echo -e "${YELLOW}⚠️ Could not check database status. Will attempt import anyway...${NC}"
        return 0  # Default to import on error
    fi
}

# Function to run the data import
import_dataset() {
    echo -e "${BLUE}📊 Starting dataset import...${NC}"
    
    # Check if the import script exists
    if [ ! -f "createDb.js" ]; then
        echo -e "${RED}❌ createDb.js not found. Skipping data import.${NC}"
        echo -e "${YELLOW}💡 To enable automatic data import, place your createDb.js file in the project root.${NC}"
        return 0
    fi
    
    # Check if dataset directory exists (mounted as volume)
    if [ ! -d "/app/dataset_resized" ]; then
        echo -e "${YELLOW}⚠️ Dataset directory not mounted at /app/dataset_resized. Skipping data import.${NC}"
        echo -e "${YELLOW}💡 To enable automatic data import, mount your dataset directory as a volume.${NC}"
        echo -e "${YELLOW}💡 Add this to your docker-compose.yml volumes section:${NC}"
        echo -e "${YELLOW}   - ./create_data/dataset_resized:/app/dataset_resized:ro${NC}"
        return 0
    fi
    
    # Check if dataset directory has content
    if [ -z "$(ls -A /app/dataset_resized 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️ Dataset directory is empty. Skipping data import.${NC}"
        return 0
    fi
    
    # List what we found in the dataset directory
    echo -e "${BLUE}📁 Dataset directory contents:${NC}"
    ls -la /app/dataset_resized | head -10  # Show first 10 items
    
    # Run the import script
    echo -e "${BLUE}🔄 Running data import script...${NC}"
    if node createDb.js; then
        echo -e "${GREEN}✅ Dataset import completed successfully!${NC}"
    else
        echo -e "${RED}❌ Dataset import failed, but continuing with server startup...${NC}"
        echo -e "${YELLOW}💡 The server will still work, but you'll need to import data manually.${NC}"
    fi
}

# Function to start the main application
start_application() {
    echo -e "${BLUE}🎮 Starting the main application server...${NC}"
    echo -e "${GREEN}🌟 Setup complete! Application is starting...${NC}"
    
    # Start the application with nodemon (same as your original CMD)
    exec sh -c "CHOKIDAR_USEPOLLING=true nodemon --verbose --watch /app --ext js,json,yaml server.js"
}

# Main execution flow
main() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}🎌 Anime Guessing Game - Docker Startup${NC}"
    echo -e "${BLUE}===========================================${NC}"
    
    # Step 1: Wait for MongoDB to be ready
    wait_for_mongodb
    
    # Step 2: Check if we should import data using exit codes instead of output parsing
    if should_import_data; then
        # Function returned 0, meaning we should import
        import_dataset
    else
        # Function returned non-zero, meaning we should skip
        echo -e "${GREEN}Skipping data import as requested${NC}"
    fi
    
    # Step 3: Start the main application
    start_application
}

# Run the main function
main "$@"