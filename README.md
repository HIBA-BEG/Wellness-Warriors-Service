# Wellness Warriors API

NestJS API for the Wellness Warriors portfolio demo. The React client lives in `wellness-warriors-client`.

## Setup

Requirements: Node.js 20+ and MongoDB.

```powershell
cd wellness-warriors-server
Copy-Item .env.example .env
npm install
```

Edit `.env` and set `JWT_SECRET` to a long random string. Set `MONGO_URI` to your local MongoDB or MongoDB Atlas connection string. SMTP variables are only needed for password-reset email.

```powershell
npm run start:dev
```

The API listens on `http://localhost:3000`.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `PORT` | no | Port to listen on. Defaults to `3000`. |
| `MONGO_URI` | yes | MongoDB connection string. |
| `JWT_SECRET` | yes | Startup fails when this is missing. |
| `JWT_ACCESS_EXPIRES` | no | Login token lifetime. Defaults to `1h`. |
| `JWT_RESET_EXPIRES` | no | Password-reset token lifetime. Defaults to `1h`. |
| `CLIENT_URL` | no | Comma-separated browser origins for CORS. `http://localhost:5173` is always allowed. The first origin is used in reset emails. |
| `SMTP_HOST` | for email | SMTP server. |
| `SMTP_PORT` | for email | SMTP port. `465` uses TLS. |
| `SMTP_USER` | for email | SMTP username. |
| `SMTP_PASS` | for email | SMTP password. |
| `SMTP_FROM` | no | Display name on outgoing mail. |
| `SMTP_ALLOW_INVALID_CERTS` | no | Set to `true` only when the SMTP server uses a certificate you cannot verify. |

Older names still work as fallbacks: `MONGODB_URI`, `APP_EMAIL`, `APP_EMAIL_PASS`, `APP_EMAIL_USERNAME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`. New deployments should use the names in the table.

## Demo data

```powershell
npm run seed
```

The command is safe to run more than once. It resets the demo passwords, replaces the event list, and removes participant accounts that are not part of this demo.

| Account | Password | Role |
| --- | --- | --- |
| `organizer@wellnesswarriors.demo` | `OrganizerDemo123!` | organizer |
| 30 participants, such as `amina.bennani@wellnesswarriors.demo` | `ParticipantDemo123!` | participant |

The organizer owns 20 events across Morocco: completed sessions from the past few weeks, scheduled sessions still to come, and two cancellations. Each person has a profile picture and each event has a poster. Image files live in `seed-images/`. The seed copies them into `uploads/` and `uploads-profile/` next to the API process. Those two folders stay out of git because local-disk uploads are ephemeral on free hosting. Public registration always creates a participant. It cannot create an organizer or an admin.

## Scripts

```powershell
npm run start:dev
npm run build
npm run start:prod
npm test
npm run seed
```

## Docker

From the repository root, copy `wellness-warriors-server/.env.example` to `wellness-warriors-server/.env`, set `JWT_SECRET`, then:

```powershell
docker compose up --build
```

Compose starts MongoDB, the API on port 3000, and the client on port 5173. Inside Compose, `MONGO_URI` points at the MongoDB service.

## Uploads

Profile pictures and event posters are stored on local disk (`uploads` and `uploads-profile`). The database stores a relative path such as `/uploads/<file>.jpg`, and the API turns that into an absolute URL when it responds.

Local-disk uploads are ephemeral on free hosting (including Render's free web service). Files disappear when the instance restarts or is replaced. Use external object storage if uploads must survive a restart.

## Render

Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), and `PORT` is provided by Render. Add the SMTP variables if password reset should send mail. The service listens on `0.0.0.0` and `process.env.PORT`.
