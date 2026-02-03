FROM node:latest AS app

# Set the working directory
WORKDIR /app

# Copy only package files to install dependencies first
# COPY package*.json ./
COPY package.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose your app's port
EXPOSE 3000

# Start your app
CMD ["node", "server.js"]
