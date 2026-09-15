# Сборка из корня репозитория:
#   docker build -f homework_1/visualization/Dockerfile -t homework1-visualization .
#
# Запуск:
#   docker run --rm -p 8080:80 homework1-visualization
#
# Открыть: http://localhost:8080

# ---------- Этап 1: сборка статики ----------
FROM node:22-alpine AS build
WORKDIR /app/homework_1/visualization

COPY homework_1/visualization/package.json homework_1/visualization/package-lock.json ./
RUN npm ci

COPY homework_1/visualization/tsconfig.json homework_1/visualization/vite.config.ts homework_1/visualization/index.html ./
COPY homework_1/visualization/README.md ./README.md
COPY homework_1/visualization/src ./src
# Код задач и README ДЗ подхватываются при сборке как raw-импорты
COPY homework_1/palindrome /app/homework_1/palindrome
COPY homework_1/sum /app/homework_1/sum
COPY homework_1/prime /app/homework_1/prime
COPY homework_1/README.md /app/homework_1/README.md

RUN npm run build

# ---------- Этап 2: раздача статики ----------
FROM nginx:1.27-alpine
COPY --from=build /app/homework_1/visualization/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
