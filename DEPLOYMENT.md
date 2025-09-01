# Deploying Code-Battle to Vercel

This guide will walk you through deploying your Code-Battle application to Vercel. The application consists of two parts: the frontend React application and the backend Node.js server.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Git](https://git-scm.com/) installed on your computer
3. Your project pushed to a GitHub repository

## Step 1: Configure Vercel Project

1. Log in to your Vercel account and click on "Add New..." > "Project"
2. Import your GitHub repository
3. Configure the project:
   - Project Name: `code-battle` (or your preferred name)
   - Root Directory: `.` (This is the root of your repository)
   - Build Command: `npm run build` (Vercel will use the `vercel.json` configuration to build both frontend and backend)
   - Output Directory: Leave empty (Vercel will handle this based on `vercel.json`)
   - Install Command: `npm install` (Vercel will install dependencies for both frontend and backend based on their respective `package.json` files)
   - Development Command: `npm start` (for local development)

## Step 2: Environment Variables

Add the following environment variables in your Vercel project settings:

- `MONGO_URI`: Your MongoDB connection string
- `FRONTEND_URL`: This will be the URL of your deployed frontend (e.g., `https://your-frontend-url.vercel.app`). You can update this after the initial deployment.
- `REACT_APP_BACKEND_URL`: This will be the URL of your deployed backend (e.g., `https://your-backend-url.vercel.app`). You can update this after the initial deployment.

## Step 3: Deploy

1. Click "Deploy"

## Step 4: Update Environment Variables (if necessary)

After the initial deployment, if your `FRONTEND_URL` or `REACT_APP_BACKEND_URL` were placeholders, update them with the actual deployed URLs in your Vercel project settings and trigger a redeployment.

## Troubleshooting

### Socket.io Connection Issues

If you experience issues with Socket.io connections:

1. Check that the `REACT_APP_BACKEND_URL` is correctly set in the frontend
2. Verify that the `FRONTEND_URL` is correctly set in the backend
3. Ensure CORS settings are properly configured

### MongoDB Connection Issues

If your application cannot connect to MongoDB:

1. Verify that the `MONGO_URI` environment variable is correctly set
2. Ensure your MongoDB Atlas cluster has the appropriate network access settings

### Deployment Fails

If your deployment fails:

1. Check the build logs in Vercel
2. Ensure all dependencies are correctly listed in your package.json files
3. Verify that your `vercel.json` configuration is correct

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Socket.io Documentation](https://socket.io/docs/v4/)