
# Backend API document

Here is a guideline to lead you open the API document.

## Steps
1. `git clone git@github.com:detaomega/ColorWeb.git` to your local device, and `git checkout backend`
2. turn on your docker and run `docker compose up --build` in your terminal
3. open a browser and go to `http://localhost:3000/api-docs/`

## Change Log Summary
### Updated Files:
### Dockerfile

Added startup script copy and execution permissions
Changed CMD to use startup script instead of direct server start
Purpose: Orchestrates MongoDB wait + data import + server startup sequence

### docker-compose.yml

Added volume mount: ./create_data/dataset:/app/dataset:ro
Added anime_images volume for persistent image storage
Purpose: Makes local dataset accessible inside container

### docker-startup.sh (new)

Waits for MongoDB readiness using connection tests
Checks if database has existing questions using exit codes
Conditionally runs data import only when database is empty
Purpose: Automates the entire startup sequence without manual intervention

### createDb.js/simpleImport.js (new)

Processes anime folder structure (anime/character_sets/1-7.jpg+original.jpg)
Copies images to public directory with safe naming
Loads alternative names from alternative.js
Creates Question documents following existing mongoose schema
Purpose: Transforms raw dataset into database entries and web-accessible images

# check db in docker terminal
1. docker exec -it colorweb-webproj_mongo-1 mongosh
2. show dbs
3. use qa_game
4. show collections
5. db.questions.countDocuments() #check total number of question(animate)
6. db.questions.find().limit(2) # take our two data