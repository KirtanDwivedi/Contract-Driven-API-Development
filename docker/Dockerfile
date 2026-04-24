# docker caching layer works place the layer which will not change very often at top 
# below a changed layer all update / rebuild done from scratch

# single state build

# use alpine as base image (smaller size)
#FROM alpine
FROM ubuntu

RUN apt-get update
RUN apt-get install -y curl
RUN apt-get upgrade -y

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs


WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY main.js main.js
# COPY .. // for all copy

ENTRYPOINT [ "node", "main.js" ]

# docker build -t my-nodejs-app . // . means file exist in this folder only (image build)
# docker run -d -p 3000:3000 --name my-nodejs-app my-nodejs-app // to run this image
# docker exec -it my-nodejs-app bash // to get into the container