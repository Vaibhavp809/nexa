# Deployment Guide

## Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `https://github.com/Vaibhavp809/nexa.git`
   - Select the `backend` directory as the root directory

2. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Add Environment Variables**
   Go to "Environment" tab and add:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_random_string
   GROQ_API_KEY=your_groq_api_key
   PORT=4000
   GROQ_API_URL=https://api.groq.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the deployed URL (e.g., `https://nexa-backend.onrender.com`)

---

## Frontend Deployment (Vercel)

1. **Import Project on Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository: `https://github.com/Vaibhavp809/nexa.git`

2. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variable**
   Go to "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com/api
   ```
   ⚠️ Replace with your actual Render backend URL from step 4 above

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

---

## Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Vercel
- [ ] Environment variables are set correctly
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test Groq API integration
- [ ] Floating Bubble works correctly

---

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

### Frontend Issues
- Verify `VITE_API_URL` points to correct backend URL
- Check browser console for CORS errors
- Ensure backend allows CORS from Vercel domain

### CORS Configuration
If you get CORS errors, update `backend/index.js`:
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```
