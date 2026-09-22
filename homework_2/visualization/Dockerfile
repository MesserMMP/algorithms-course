FROM node:24-alpine AS build
WORKDIR /app/visualization
COPY visualization/package.json visualization/package-lock.json ./
RUN npm ci
COPY . /app
RUN npm run build

FROM nginx:stable-alpine
COPY visualization/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/visualization/dist /usr/share/nginx/html
USER 101:101
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8082/visualization/ || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
