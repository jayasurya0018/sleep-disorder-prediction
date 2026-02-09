## Realtime stack quickstart (Windows)

1. Install deps
	- Backend: `cd server && npm install`
	- Frontend: `cd client && npm install`
	- ML: `cd ml && pip install -r requirements.txt`
	- Or run root helper: `npm run install:all`

2. Environment
	- Set `MONGO_URI` and `JWT_SECRET` in `server/.env`
	- For email alerts set `EMAIL_USER` / `EMAIL_PASSWORD`

3. Start services (three terminals)
	- `cd server && npm start`
	- `cd ml && python realtime_app.py`
	- `cd client && npm start`

4. Optional helpers
	- Windows install script: `./install-realtime.bat`
	- Token + WebSocket smoke test: `cd server && node test-websocket.js`
	- Full feature test: `cd server && node test-features.js`

5. ML checks
	- Quick rule sanity: `cd ml && python test_severity.py`
	- Retrain (needs data.csv): `cd ml && python retrain_model.py`

6. Wearables
	- API base: `http://localhost:5000` (configurable in client via `REACT_APP_API_URL`)
	- WebSocket: `ws://localhost:5000/ws` (uses JWT)
	- Provide real tokens for Fitbit/Oura; Garmin currently mock fetch

7. Exports
	- Data stored in memory buffer per user; exports land in `exports/`
	- Endpoints: `POST /api/export/csv`, `POST /api/export/pdf`

8. Email alerts
	- Requires SMTP creds; enable via `/api/email/preferences`

Run order to smoke-test: backend → ML → frontend → `node server/test-websocket.js` (paste JWT) → connect device in UI → start streaming → verify live cards update; then hit export/email as needed.
