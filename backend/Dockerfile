FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# No external npm packages needed; uses native node modules
COPY server.js ./

EXPOSE 8888

ENV NODE_ENV=production
ENV PORT=8888

CMD ["node", "server.js"]
