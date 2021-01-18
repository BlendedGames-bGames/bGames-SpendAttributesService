FROM node:lts-alpine
WORKDIR /usr/src/app
COPY bGames-SpendAttributesService/package*.json ./
RUN npm install
COPY bGames-SpendAttributesService ./
RUN ls -l
CMD ["npm", "run", "prod"]