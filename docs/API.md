# API Documentation

Base URL (local): `http://localhost:5000`

## Health

### `GET /`
Returns a plain text response:

- `200 OK`: `Home page`

## Users API

Base path: `/api/v1/users`

### `POST /api/v1/users/register`
Register a new user.

Request body:

```json
{
  "name": "Abhishek",
  "username": "abhishek01",
  "password": "secret123"
}
```

Responses:

- `201 Created`

```json
{
  "message": "User registered successfully"
}
```

- `409 Conflict`

```json
{
  "message": "User already registered"
}
```

- `500 Internal Server Error`

```json
{
  "message": "Something went wrong : <error>"
}
```

### `POST /api/v1/users/login`
Login with username/password.

Request body:

```json
{
  "username": "abhishek01",
  "password": "secret123"
}
```

Responses:

- `200 OK`

```json
{
  "token": "<random-hex-token>"
}
```

- `400 Bad Request`

```json
{
  "message": "Incorrect password or username"
}
```

- `404 Not Found`

```json
{
  "message": "User does not exist"
}
```

- `401 Unauthorized`

```json
{
  "message": "Invalid credentials"
}
```

## Meeting API

Base path: `/api/v1/meeting`

### `POST /api/v1/meeting/create`
Create a meeting and generate a unique 6-character meeting code.

Request body:

```json
{
  "hostId": "alice01",
  "hostName": "Alice",
  "title": "Sprint Planning",
  "description": "Planning for next sprint",
  "durationMinutes": 45,
  "scheduledFor": "2026-03-10T18:30:00.000Z"
}
```

Notes:

- `hostId` and `hostName` are required.
- `scheduledFor` is optional and must be a valid future datetime if provided.
- Duration resolution order:
`durationMinutes` if valid and > 0, otherwise `durationHours * 60` if valid and > 0, otherwise defaults to `1440` minutes (24h).

Responses:

- `201 Created`

```json
{
  "message": "Meeting created successfully",
  "meeting": {
    "meetingId": "1770090252592",
    "meetingCode": "A1B2C3",
    "hostId": "alice01",
    "hostName": "Alice",
    "title": "Sprint Planning",
    "description": "Planning for next sprint",
    "participants": [
      {
        "userId": "alice01",
        "username": "Alice"
      }
    ],
    "isActive": true,
    "expiresAt": "2026-03-10T19:15:00.000Z"
  },
  "meetingId": "1770090252592",
  "meetingCode": "A1B2C3"
}
```

- `400 Bad Request` (`hostId`/`hostName` missing, invalid `scheduledFor`, or non-future schedule)
- `500 Internal Server Error`

### `POST /api/v1/meeting/join`
Add participant metadata to meeting.

Request body:

```json
{
  "meetingId": "1770090252592",
  "userId": "bob01",
  "username": "Bob"
}
```

Responses:

- `200 OK` (participant added)
- `200 OK` (already exists, may update username)
- `400 Bad Request`
- `404 Not Found`
- `500 Internal Server Error`

### `POST /api/v1/meeting/leave`
Mark participant as left and compute participant duration in seconds.

Request body:

```json
{
  "meetingId": "1770090252592",
  "userId": "bob01"
}
```

Responses:

- `200 OK`
- `400 Bad Request`
- `404 Not Found` (meeting or participant)
- `500 Internal Server Error`

### `POST /api/v1/meeting/end`
End meeting and optionally persist transcript/summary/captions.

Request body:

```json
{
  "meetingId": "1770090252592",
  "transcript": "...",
  "summary": "...",
  "captions": [
    {
      "timestamp": "2026-03-10T12:34:56.000Z",
      "socketId": "abc123",
      "userId": "alice01",
      "username": "Alice",
      "text": "hello everyone"
    }
  ]
}
```

Accepted caption payload aliases:

- `captionEntries`
- `captions`
- `captionsJsonText` (JSON string)

Behavior:

- Sets `endedAt`, `isActive=false`, `expiresAt=now`
- Computes meeting `duration` if `startedAt` exists
- Appends normalized caption entries to `liveCaptions`
- Regenerates `captionsJsonText` as sorted JSON string
- If transcript is missing but captions exist, transcript is synthesized from captions

Responses:

- `200 OK`
- `400 Bad Request` (missing `meetingId`)
- `404 Not Found`
- `500 Internal Server Error`

### `POST /api/v1/meeting/captions/finalize`
Append finalized caption entries during a running meeting.

Request body:

```json
{
  "meetingId": "1770090252592",
  "userId": "alice01",
  "username": "Alice",
  "captions": [
    {
      "timestamp": "2026-03-10T12:34:56.000Z",
      "socketId": "abc123",
      "text": "final sentence"
    }
  ]
}
```

Responses:

- `200 OK`

```json
{
  "message": "Caption JSON saved",
  "saved": 1
}
```

- `400 Bad Request` (missing `meetingId`, missing/invalid captions)
- `404 Not Found`
- `500 Internal Server Error`

### `GET /api/v1/meeting/user/:userId/hosted`
Get meetings where user is host.

Responses:

- `200 OK`

```json
{
  "message": "User meetings retrieved",
  "meetings": []
}
```

### `GET /api/v1/meeting/user/:userId/participated`
Get meetings where user appears in `participants.userId`.

Responses:

- `200 OK`

```json
{
  "message": "User participated meetings retrieved",
  "meetings": []
}
```

### `GET /api/v1/meeting/code/:meetingCode`
Resolve meeting by code.

Responses:

- `200 OK`

```json
{
  "message": "Meeting found",
  "meeting": {},
  "meetingId": "1770090252592"
}
```

- `400 Bad Request` (missing code)
- `404 Not Found` (invalid code)
- `410 Gone` (meeting expired/ended)

```json
{
  "error": "Meeting has expired",
  "expired": true,
  "expiresAt": "2026-03-10T13:00:00.000Z"
}
```

### `GET /api/v1/meeting/:meetingId`
Get meeting details by ID.

Query params:

- `includeInactive=true` to allow fetching ended/expired meetings

Responses:

- `200 OK`

```json
{
  "message": "Meeting details retrieved",
  "meeting": {}
}
```

- `404 Not Found`
- `410 Gone` when meeting is expired and `includeInactive` is not true

## Notes and Limitations

- No JWT middleware currently protects meeting endpoints.
- CORS allows `http://localhost:3000` and `http://localhost:3001`.
- `backend/src/controllers/meetingController.js` includes audio upload/transcription/PDF handlers, but these routes are currently not mounted.
- Frontend component `MeetingRecorder.jsx` calls `POST /api/v1/meeting/summarize`, which is not present in active backend routes.
