FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# Ensure data and public/generated directories exist
RUN mkdir -p data public/generated

EXPOSE 3456

ENV PORT=3456
ENV NODE_ENV=production

CMD ["node", "server.mjs"]
