FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:admin && PUBLIC_BASE_PATH=/driver pnpm build:driver

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html/admin
COPY --from=build /app/apps/driver/dist /usr/share/nginx/html/driver
EXPOSE 80
