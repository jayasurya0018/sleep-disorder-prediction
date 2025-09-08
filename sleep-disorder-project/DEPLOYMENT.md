# FREE Deployment Instructions for Sleep Disorder Project

## 1. MongoDB Atlas (Database)
- Go to https://www.mongodb.com/cloud/atlas and create a free account.
- Create a free cluster, add a user, and get your connection string (e.g., `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/sleepdb?retryWrites=true&w=majority`).
- Update your backend `.env` file: `MONGO_URI=your_connection_string`

## 2. Backend (Node/Express) on Render (Free Tier)
- Go to https://render.com and sign up.
- Click "New Web Service" > "Create from GitHub Repo" (connect your repo or upload code).
- Set build command: `npm install`
- Set start command: `node index.js` (or your entry point)
- Add environment variables: `MONGO_URI`, `JWT_SECRET`, etc.
- Set the port to 5001 (or as needed).
- Deploy!

## 3. ML API (Flask) on Render (Free Tier)
- Go to https://render.com and create a new "Web Service".
- Use Python 3.9+ environment.
- Set build command: `pip install -r requirements.txt`
- Set start command: `python app.py`
- Add environment variables as needed.
- Set the port to 5000 (or as needed).
- Deploy!

## 4. Frontend (React) on Vercel (Free)
- Go to https://vercel.com and sign up.
- Import your repo or upload the `client` folder.
- Set build command: `npm install && npm run build`
- Set output directory: `build`
- Set environment variable: `REACT_APP_API_URL` to your Render backend URL.
- Deploy!

## 5. Update CORS and URLs
- Make sure your backend allows CORS from your frontend domain.
- Update all API URLs in the frontend to point to your deployed backend.

## 6. Test Everything
- Register/login, add data, import smartwatch/demo data, run analysis, and view analytics.

---

**You now have a fully deployed, free, production-ready sleep disorder platform!**
