# OtaWilma-API
API used to store user's configuration and theme files in OtaWilma project.

Documentation coming soon


## Docker
`docker build . -t otawilma-api`
`docker run --rm -it --mount type=bind,source=./secret.json,target=/otawilma/secret.json --mount type=bind,source=./config.json,target=/otawilma/config.json otawilma-api`