# Deploy to GitHub

Follow these steps to deploy your Miku Monday Bot to GitHub:

## Prerequisites

1. A GitHub account
2. Git installed (already confirmed)
3. This repository

## Steps to Deploy to GitHub

### 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and log in to your account
2. Click the "+" icon in the upper right corner and select "New repository"
3. Name your repository (e.g., "miku-monday-bot")
4. Optionally add a description
5. Choose Public or Private
6. **Important**: Leave all checkboxes unchecked (no README, no .gitignore, no license)
7. Click "Create repository"

### 2. Push Your Local Repository to GitHub

After creating the repository on GitHub, you'll see a page with setup instructions. You need to run the following commands in your terminal:

```bash
cd c:\Users\Temp\OneDrive\Documents\Coding\miku-monday
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name.

### 3. Verify the Push

After running the commands, refresh your GitHub repository page. You should see all your files uploaded.

## Alternative Method: Using GitHub CLI

If you have GitHub CLI installed:

1. Install GitHub CLI if you haven't already
2. Run:
   ```bash
   gh repo create miku-monday-bot --public --push
   ```

## Troubleshooting

### If you get authentication errors:

1. Use GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with "repo" permissions
   - Use the token instead of your password when prompted

2. Or configure SSH keys:
   - Generate SSH keys
   - Add the public key to your GitHub account
   - Use SSH URL instead of HTTPS URL

### If you need to force push (only if there are conflicts):

```bash
git push -u origin main --force
```

## Next Steps

After pushing to GitHub:
1. You can deploy directly from GitHub to Zeabur
2. Others can fork or clone your repository
3. You can accept contributions through pull requests