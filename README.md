# SecureForm — Real-time Data Masking (MERN Stack)

A full-stack demo showing how to mask sensitive user data **as it is collected**, so raw values are never persisted.

---

## Architecture

```
Browser (React)
  │  User types → masking runs client-side → preview shown instantly
  │  Form submits raw values over HTTPS (TLS protects in transit)
  ▼
Express API (Node.js)
  │  Receives raw values
  │  Runs masking.js → produces masked strings
  │  Raw values are immediately discarded (never touch the DB)
  ▼
MongoDB (Mongoose)
  │  Stores ONLY masked strings
  └─ name, email (masked), phone (masked), nationalId (masked), cardNumber (masked)
```

---

## Masking rules

| Field       | Rule                                          | Example                          |
|-------------|-----------------------------------------------|----------------------------------|
| Name        | Not masked — display field                    | `Jane Doe`                       |
| Email       | Keep first 2 chars of local + 1 of domain     | `ja***@e******.com`              |
| Phone       | Keep first 2 chars, mask remaining digits     | `+2**********`                   |
| National ID | Keep first 2 chars, mask the rest             | `12******`                       |
| Card number | Keep last 4 digits (PCI-DSS), mask the rest   | `**** **** **** 1111`            |

---

## Quick start

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# Edit server/.env if your MongoDB URI or port differs
```

### 3. Run both server and client
```bash
npm install          # installs concurrently at root
npm run dev          # starts Express on :5000 and React on :3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
data-masking/
├── package.json              ← root scripts (concurrently)
├── server/
│   ├── index.js              ← Express entry point
│   ├── masking.js            ← pure masking functions (server-side)
│   ├── models/
│   │   └── UserSubmission.js ← Mongoose schema (masked fields only)
│   ├── routes/
│   │   └── submissions.js    ← POST /api/submissions, GET /api/submissions
│   └── middleware/
│       └── validate.js       ← input validation + Luhn check
└── client/
    ├── public/index.html
    └── src/
        ├── App.js            ← main component, tab layout
        ├── App.css           ← styles
        ├── utils/
        │   └── masking.js    ← mirrors server/masking.js for live preview
        ├── hooks/
        │   └── useForm.js    ← form state, live masking, API calls
        └── components/
            ├── MaskedField.js       ← input + masked preview
            └── SubmissionHistory.js ← paginated table of stored records
```

---

## API endpoints

| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/api/submissions`      | Accept raw data, mask, persist, respond  |
| GET    | `/api/submissions`      | List stored (masked) submissions         |
| GET    | `/api/submissions/:id`  | Single submission by ID                  |
| DELETE | `/api/submissions/:id`  | Remove a submission                      |
| GET    | `/api/health`           | Server + DB health check                 |

---

## Security notes

- Raw values exist **only in memory** during a single request cycle on the server.
- MongoDB never receives unmasked sensitive data.
- The client-side masking is a UX preview only — the server always re-masks independently.
- Add authentication (e.g. JWT) to the `GET /api/submissions` route before deploying.
- Use HTTPS in production to protect raw values in transit.
