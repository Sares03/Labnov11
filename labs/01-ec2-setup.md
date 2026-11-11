# Lab 01 — Launch EC2 and connect over SSH

Amazon EC2 runs virtual servers. In this lab, you’ll launch an Ubuntu server for the MERN CRUD app.

## 1. Start Learner Lab

1. Sign in to [AWS Academy](https://awsacademy.instructure.com/) and open **Learner Lab** from your course modules.
2. Click **Start Lab**. When the indicator beside **AWS** turns green, click **AWS** to open the console.
3. Select **US East (N. Virginia)** (`us-east-1`) and open **EC2 → Instances → Launch instances**.

## 2. Launch the instance

| Setting | Value |
| --- | --- |
| Name | `twa2-deploy` |
| Image | Canonical Ubuntu Server 24.04 LTS, 64-bit (x86) |
| Instance type | `t3.micro` |
| Key pair | Create `twa2-deploy` as **RSA**, **.pem** |
| Network | Default VPC and subnet. Enable **Auto-assign public IP**. |
| Root storage | **16 GiB gp3** |

When you create the key pair, your browser downloads `twa2-deploy.pem`. Save it outside the repository, for example in `C:\Users\YOUR_WINDOWS_USERNAME\.ssh\`. Keep the file private. EC2 gives you one download when you create the key pair.

Under **Network settings → Edit**, create a security group with these inbound rules.

| Type | Protocol and port | Source |
| --- | --- | --- |
| SSH | TCP 22 | **My IP** |
| HTTP | TCP 80 | **My IP** |

Launch the instance. Wait for **Running** and all status checks to pass. In **Details**, copy the **Public IPv4 address**.

## 3. Connect from VS Code

1. In **EC2 → Instances**, select your instance and click **Connect → In SSH client**.
2. Under **How to connect**, copy the SSH command shown in step 4.
3. In VS Code, open a **Git Bash** terminal and paste the command. Replace the quoted key filename after `-i` with the path to your downloaded `.pem`. Keep `ubuntu@` and the public DNS name from your own EC2 command.

For example, if your key is saved as `C:\.ssh\twa2-deploy.pem`, use this form with your instance’s public DNS name.

```bash
ssh -i "/c/.ssh/twa2-deploy.pem" ubuntu@YOUR_EC2_PUBLIC_DNS
```

If your key is in Downloads, use `"$HOME/Downloads/twa2-deploy.pem"` after `-i`. Keep the quotes, especially if the path contains spaces. Use the actual filename if your browser saved it under a different name.

On the first connection, compare the SSH fingerprint with the instance’s host fingerprint in **Actions → Monitor and troubleshoot → Get system log**. Enter `yes` if they match.

| SSH error | What to check |
| --- | --- |
| Key file missing | Verify the filename and path with `ls -l "/c/.ssh/twa2-deploy.pem"`. |
| Bad key permissions | In Windows File Explorer, open the key’s **Properties → Security → Advanced**. Disable inheritance and leave only your Windows account with read access. |
| Connection timed out | Confirm the current public IPv4 address and refresh the **SSH → My IP** inbound rule. |
| Permission denied (publickey) | Use `ubuntu` and the private key for the key pair shown under **Connect → In SSH client**. |

**Checkpoint:** Your terminal shows an Ubuntu prompt. Run `whoami`, `uname -m`, and `df -h /`. Confirm `ubuntu`, `x86_64`, and space to install Docker and pull images.

Continue to [Lab 02](02-automate-deployment.md). If you stop EC2 between labs, copy its current public IPv4 address when you restart it.

[AWS SSH setup and key permissions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connection-prereqs-general.html)
