FROM node:24-alpine AS build
WORKDIR /app/homework_5/visualization
COPY visualization/package*.json ./
RUN npm ci
COPY . /app/homework_5
RUN npm run build
FROM python:3.12-slim
WORKDIR /app
COPY . /app/homework_5
COPY --from=build /app/homework_5/visualization/dist /app/homework_5/visualization/dist
ENV PYTHONDONTWRITEBYTECODE=1
USER 10001:10001
EXPOSE 8085
CMD ["python", "-m", "homework_5.server"]
