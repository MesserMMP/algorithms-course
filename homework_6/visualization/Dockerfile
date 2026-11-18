FROM node:24-alpine AS build
WORKDIR /app/homework_6/visualization
COPY visualization/package*.json ./
RUN npm ci
COPY . /app/homework_6
RUN npm run build
FROM python:3.12-slim
WORKDIR /app
COPY . /app/homework_6
COPY --from=build /app/homework_6/visualization/dist /app/homework_6/visualization/dist
ENV PYTHONDONTWRITEBYTECODE=1
USER 10001:10001
EXPOSE 8086
CMD ["python", "-m", "homework_6.visualization.server"]
