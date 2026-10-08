# BUILD
FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . /usr/src/app
RUN bun run build

# production
FROM nginx:1.27-alpine

# Create a non-privilleged user that we'll use to run nginx during the build
RUN adduser -D user

COPY nginx /etc/nginx

# Allow all users to write to /var/cache/nginx
RUN chmod -Rc a+w /var/cache/nginx

 # Allow all users to write to /run (for nginx.pid files)
RUN chmod -c a+w /run

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Switch to our user
USER user

RUN nginx -t

# Remove the created nginx.pid file
RUN rm -v /var/run/nginx.pid

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]