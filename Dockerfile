# BUILD
FROM node:22-alpine AS builder

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json bun.lockb ./
RUN npm ci

COPY . /usr/src/app
RUN npm run build

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