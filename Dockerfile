# build environment
FROM node:14.15.0-alpine as react-build
ENV HOME=/home
ENV PATH $HOME/app/node_modules/.bin:$PATH
COPY . $HOME/app/
WORKDIR $HOME/app
RUN rm -rf node_modules/ build/
RUN npm set unsafe-perm true
RUN npm install --force
RUN npm run test
COPY . $HOME/app/

