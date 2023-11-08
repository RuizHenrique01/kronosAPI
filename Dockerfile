FROM node:16.13-alpine3.15

RUN apk --no-cache add --virtual .builds-deps build-base python3

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies
RUN npm install --production && npm rebuild bcrypt --build-from-source && npm cache clean --force 

COPY . .

RUN npm run build 

FROM node:16.13-alpine3.15

RUN apk --no-cache add --virtual .builds-deps build-base python3

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/static ./static
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD [ "npm", "run", "start:prod" ]
