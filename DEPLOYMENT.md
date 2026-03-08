# Deployment Guide

This guide will help you self-host your own instance of **urBackend** by deploying the backend and frontend to popular cloud platforms.

## 1. Deploying the Backend
You can deploy the `backend/` directory to platforms like **Render** or **Railway.app**.

### Prerequisites
- **MongoDB Atlas**: Create a free cluster and obtain your `MONGO_URI`.
- **Redis**: Use a service like [Upstash](https://upstash.com/) for a managed Redis instance.

### Steps
1. Connect your GitHub repository to Render/Railway.
2. Set the root directory to `backend/`.
3. Add the following **Environment Variables** in the platform's dashboard:
   ```bash
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   REDIS_URL=your_redis_connection_url
   JWT_SECRET=your_secure_random_string
   # Add other variables from .env.example
   ```
4. Set the Start Command to: `npm start` (or `node index.js`).
5. Deploy and save the resulting URL (e.g., `https://your-backend.onrender.com`).

---

## 2. Deploying the Frontend
The `frontend/` directory is a Vite/React application, ideal for **Vercel** or **Render**.

### Steps
1. Import your repository into Vercel.
2. Set the Root Directory to `frontend/`.
3. Set the Build Command to: `npm run build`.
4. Set the Output Directory to: `dist`.
5. **Required Environment Variables**:
   - `VITE_API_BASE_URL`: Set this to the backend URL you generated in the previous step (e.g., `https://your-backend.onrender.com`).
6. Deploy the project.

---

## 💡 Tips
- Always keep your `.env` variables secure.
- For production, ensure you set up CORS settings in your backend to allow requests only from your deployed frontend domain.