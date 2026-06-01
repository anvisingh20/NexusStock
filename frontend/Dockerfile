# Stage 1: Build the Vite React app
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . /app/
# Ensure build env variables are exposed if needed
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve files using Nginx
FROM nginx:1.25-alpine

COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy custom nginx config if custom routing is needed, otherwise default nginx works perfectly for local serving
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
