FROM node

ADD index.js /app/index.js
ADD package.json /app/package.json
ADD pod.json /app/pod.json
ADD configmap.json /app/configmap.json

WORKDIR /app
RUN npm i
