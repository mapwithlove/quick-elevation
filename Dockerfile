FROM osgeo/gdal:ubuntu-small-3.1.1

RUN apt-get update &&\
    apt-get install -y \
    git

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y \
    nodejs

RUN npm i -g yarn

RUN mkdir -p /opt/app
WORKDIR /opt/app

RUN mkdir -p /tmp/quickelevation
ADD package.json /tmp/quickelevation/
RUN cd /tmp/quickelevation && yarn --network-timeout 100000

RUN ln -s /tmp/quickelevation/node_modules &&\
    ln -s /tmp/quickelevation/package.json &&\
    ln -s /tmp/quickelevation/yarn.lock

CMD yarn run example