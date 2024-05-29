# OtaWilma-API
API used to store user's configuration and theme files in OtaWilma project.

Documentation coming soon

```bash
docker run --rm --mount type=bind,source="$(pwd)"/config.json,target=/otawilma/config.json --mount type=bind,source="$(pwd)"/secret.json,target=/otawilma/secret.json $(docker build . -q)
```
