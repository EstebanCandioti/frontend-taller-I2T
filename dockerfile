FROM node:20-alpine AS build
WORKDIR /app

COPY mesa-de-ayuda/package*.json ./
RUN npm install

COPY mesa-de-ayuda/ .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/mesa-de-ayuda/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80