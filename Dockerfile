FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

COPY . .

# NEW: Copy the startup script and make it executable
COPY docker-startup.sh /usr/local/bin/docker-startup.sh
RUN chmod +x /usr/local/bin/docker-startup.sh

# Create necessary directories inside the container
# These will be used for storing processed images and mounting the dataset
RUN mkdir -p /usr/src/app/public/images
RUN mkdir -p /app/dataset


EXPOSE 3000

# NEW: Use the startup script instead of directly starting the server
# This script will handle waiting for MongoDB, importing data, then starting the server
CMD ["/usr/local/bin/docker-startup.sh"]