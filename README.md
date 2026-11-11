# MERN CRUD deployment lab starter

A user directory with a React frontend, an Express API, and MongoDB. Socket.IO keeps open browser sessions in sync.

## Run locally

With Docker Desktop running, run these commands from the repository root.

```bash
docker compose up -d --build --wait
docker compose exec api npm run seed
```

Open **http://localhost:4200**. The seed command adds four fictional users to an empty database. Running it again skips existing sample email addresses.

The frontend and API build as separate images. Nginx serves the Vite build and proxies API and Socket.IO requests. MongoDB data lives in the `mongo-data` named volume. Run `docker compose down` to stop the stack and keep that data.

## Deployment labs

1. [Launch EC2 and connect over SSH](labs/01-ec2-setup.md)
2. [Publish and deploy with GitHub Actions](labs/02-automate-deployment.md)

## Source and license

Adapted from [Ceferino Jose II’s MERN CRUD](https://github.com/cefjoeii/mern-crud) under the [MIT license](LICENSE).
