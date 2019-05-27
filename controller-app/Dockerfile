FROM node

ADD index.js /app/index.js
ADD package.json /app/package.json
ADD statefulset.json /app/statefulset.json
ADD cronjob.json /app/cronjob.json
ADD pod-template-spec.json /app/pod-template-spec.json
ADD configmap.json /app/configmap.json

WORKDIR /app
RUN npm i
