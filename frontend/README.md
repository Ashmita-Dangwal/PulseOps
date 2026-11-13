# PulseOps dashboard

Serve this folder with any static HTTP server. Example from PowerShell:

```powershell
python -m http.server 5173
```

Then open `http://localhost:5173`. The API defaults to `http://localhost:5000/api`; adjust `config.js` for another host. Set backend `CORS_ORIGIN` to the dashboard origin. Authentication, project/monitor management, analytics, incident history and Socket.IO live events are included.
