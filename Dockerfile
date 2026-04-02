FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to handle permissionss
USER root

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Fix permissions so the pptruser can access the files
RUN chown -R pptruser:pptruser /usr/src/app

# Switch back to the puppeteer user
USER pptruser

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

EXPOSE 4000

CMD ["node", "index.js"]