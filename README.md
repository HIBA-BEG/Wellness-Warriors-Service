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
| `NODE_ENV` | no | Set to `production` on Render. The seed then requires `SEED_CONFIRM=yes`. |
| `SEED_CONFIRM` | no | Set to `yes` only to allow `npm run seed` when `NODE_ENV=production`. |

Older names still work as fallbacks: `MONGODB_URI`, `APP_EMAIL`, `APP_EMAIL_PASS`, `APP_EMAIL_USERNAME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`. New deployments should use the names in the table.

## Demo data

```powershell
npm run seed
```

The command is safe to run more than once on a local database. It resets the demo passwords, replaces the event list, and removes participant accounts that are not part of this demo. It prints the database host and name, without the password, before it changes anything.

When `NODE_ENV` is `production`, the seed stops unless `SEED_CONFIRM=yes`. It is not part of `npm start` or `npm run start:prod`.

| Account | Password | Role |
| --- | --- | --- |
| `organizer@wellnesswarriors.demo` | `OrganizerDemo123!` | organizer |
| 30 participants, such as `amina.bennani@wellnesswarriors.demo` | `ParticipantDemo123!` | participant |

The organizer owns 20 events across Morocco: completed sessions from the past few weeks, scheduled sessions still to come, and two cancellations. Each person has a profile picture and each event has a poster. Those files stay in `seed-images/` and the API serves them from `/seed-images/`. The database stores a relative path such as `/seed-images/events/e01.jpg`. Public registration always creates a participant. It cannot create an organizer or an admin.

## Scripts

```powershell
npm run start:dev
npm run build
npm run start:prod
npm test
npm run seed
```

## Docker

From this folder, set `JWT_SECRET` in the shell, then:

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-string"
docker compose up --build
```

`docker-compose.yml` starts MongoDB and the API on port 3000. Run the React client separately. Inside Compose, `MONGO_URI` points at the MongoDB service.

## Uploads

Profile pictures and event posters are stored on local disk (`uploads` and `uploads-profile`). The database stores a relative path such as `/uploads/<file>.jpg`, and the API turns that into an absolute URL when it responds.

Local-disk uploads are ephemeral on free hosting (including Render's free web service). Files disappear when the instance restarts or is replaced. Use external object storage if uploads must survive a restart.

## Render

Use Node `20` (`NODE_VERSION=20`).

- Build command: `npm ci && npm run build`
- Start command: `npm run start:prod`

Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` (your Vercel URL). Render sets `PORT`. Leave SMTP unset on the free plan: outbound mail ports are blocked, and forgot-password returns 503 instead of hanging. Do not set `SEED_CONFIRM` on the web service. Demo posters and profile pictures are served from `seed-images/` in the image, so they survive a restart. Files uploaded after that still live on the local disk and disappear when the instance restarts.
