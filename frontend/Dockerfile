FROM node:21.7.3-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm cache clean --force
RUN npm install

COPY . .
RUN npm run build

FROM httpd:2.4.57-alpine

COPY --from=builder /app/build /usr/local/apache2/htdocs/

EXPOSE 3000

CMD ["httpd-foreground"]
