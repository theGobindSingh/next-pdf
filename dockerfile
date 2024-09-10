FROM node:lts-alpine
WORKDIR /app
COPY package.json /app
RUN yarn
COPY . .
RUN yarn build
CMD [ "yarn", "start" ]