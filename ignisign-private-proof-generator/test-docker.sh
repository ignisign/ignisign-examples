#!/bin/bash

docker run -it --rm -p 4243:4243 --env-file ./docker-env-file.list ignisign/ignisign-private-proof-generator 

