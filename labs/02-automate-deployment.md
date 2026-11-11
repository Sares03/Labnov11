# Lab 02 — Publish and deploy with GitHub Actions

Use the Dockerized MERN CRUD starter in your own **private GitHub repository** with `main` as its default branch. Your EC2 instance from [Lab 01](01-ec2-setup.md) will run the deployment job.

## 1. Prepare EC2 over SSH

Reconnect from VS Code Git Bash using the key and current public address from Lab 01. Run the commands below **inside the Ubuntu SSH session**.

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo -n docker compose version
```

In your repository, open **Settings → Actions → Runners → New self-hosted runner**. Select **Linux** and **x64**. Run the download and configuration commands GitHub displays on EC2 as `ubuntu`. Add the label `ec2-deploy` when prompted. Keep the default work folder. From the runner directory, run:

```bash
sudo ./svc.sh install ubuntu
sudo ./svc.sh start
```

**Checkpoint:** GitHub lists the runner as **Idle** with the `ec2-deploy` label. Keep SSH and HTTP restricted to **My IP**. The runner connects outbound to GitHub.

## 2. Publish the images

In your **local repository**, create `.github/workflows/deploy.yml` and paste the workflow below. It tests the frontend, builds both images, and publishes them to GHCR with the commit SHA as the tag. GitHub supplies `GITHUB_TOKEN` for this job.

```yaml
name: Publish and deploy

on:
  push:
    branches: [main]

concurrency:
  group: mern-ec2
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
      - name: Test frontend
        working-directory: react-src
        run: |
          npm ci
          npm test
      - name: Build and publish
        env:
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          prefix="ghcr.io/${GITHUB_REPOSITORY,,}"
          web="$prefix-web:$GITHUB_SHA"
          api="$prefix-api:$GITHUB_SHA"
          docker build -t "$web" ./react-src
          docker build -t "$api" .
          printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
          docker push "$web"
          docker push "$api"
```

Commit and push to `main`. In **Actions**, confirm `publish` passed. In **Packages**, verify that the `-web` and `-api` images have the same commit SHA tag.

## 3. Add automated deployment

Append this job to the **same workflow file**, aligned with `publish:` under `jobs:`. Use the provided `compose.deploy.yaml` in the repository root. It pulls the two images, publishes HTTP on port 80, and keeps MongoDB data in a named volume.

```yaml
  deploy:
    needs: publish
    runs-on: [self-hosted, linux, x64, ec2-deploy]
    timeout-minutes: 10
    permissions:
      contents: read
      packages: read
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Deploy to EC2
        env:
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          prefix="ghcr.io/${GITHUB_REPOSITORY,,}"
          deploy_dir="$HOME/mern-deploy"
          mkdir -p "$deploy_dir"
          cp compose.deploy.yaml "$deploy_dir/"
          cd "$deploy_dir"
          printf 'WEB_IMAGE=%s-web:%s\nAPI_IMAGE=%s-api:%s\n' \
            "$prefix" "$GITHUB_SHA" "$prefix" "$GITHUB_SHA" > .env

          docker_config="$(mktemp -d)"
          trap 'sudo -n rm -f -- "$docker_config/config.json"; rmdir -- "$docker_config"' EXIT
          printf '%s' "$GHCR_TOKEN" | sudo -n docker --config "$docker_config" \
            login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
          sudo -n docker --config "$docker_config" compose -f compose.deploy.yaml \
            up -d --pull always --wait --wait-timeout 120
          curl -fsS --retry 5 --retry-all-errors http://127.0.0.1/api/health
```

Commit and push again. Confirm both jobs passed, then open `http://YOUR_PUBLIC_IPV4` in your browser. In the **EC2 SSH session**, load the sample records once:

```bash
cd ~/mern-deploy
sudo docker compose -f compose.deploy.yaml exec api npm run seed
```

Refresh the app. Confirm four sample users appear and add a fictional user of your own.

## 4. Deploy a visible change

In your **local repository**, open `react-src/src/components/App/App.jsx`. Replace the existing heading with this line:

```jsx
<h1 className='App-intro'>MERN CRUD — Version 2</h1>
```

In `react-src/src/components/App/App.test.jsx`, update the expected heading to `MERN CRUD — Version 2` too. Commit both files and push to `main`.

**Checkpoint:** Show the successful `publish → deploy` run, the **Version 2** heading in the browser, and the user you added before the update.

## Troubleshooting

### Deploy is queued

1. In **Actions**, open the run and select **deploy**. If it says **Waiting for a runner**, confirm that your EC2 instance is running.
2. In your repository, go to **Settings → Actions → Runners**. Open your runner and check that it is **Idle** and that its labels include `self-hosted`, `Linux`, `X64`, and `ec2-deploy`. If the last label is missing, click the gear next to **Labels** and add it. The runner name and labels are separate settings.
3. If the runner is **Offline**, SSH into EC2 and run `sudo ./svc.sh start` from the runner directory. If it shows **Idle** with the matching labels and the job stays queued, restart the service from that directory.

   ```bash
   cd ~/actions-runner
   sudo ./svc.sh stop
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```

4. Refresh the Actions run and look for **Set up job**. If the run was cancelled or has already failed, use **Re-run jobs** to retry the same commit.

### Other deployment issues

- **GHCR denies access:** Confirm the images belong to your repository’s workflow and the deploy job has `packages: read`.
- **The site times out:** On EC2, run `curl -fsS http://127.0.0.1/api/health`. If it returns `OK`, use the instance’s current public IPv4 and refresh the **HTTP → My IP** rule.
- **After restarting EC2:** Reconnect over SSH, run `cd ~/mern-deploy` and `sudo docker compose -f compose.deploy.yaml up -d --wait` to start the existing images, then open the current public IPv4 address.

Stop EC2 and end the Learner Lab session when finished.

[Docker installation on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) · [GitHub self-hosted runners](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners) · [GHCR authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
