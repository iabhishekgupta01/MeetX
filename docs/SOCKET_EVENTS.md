# Socket Events Documentation

Server implementation: `backend/src/controllers/socketManager.js`
Client reference: `frontend/src/pages/VideoMeet.jsx`

Connection URL (local): `http://localhost:5000`

## Room Model

- A room maps to a `meetingId`.
- On successful join, socket is added to `connections[meetingId]`.
- Server tracks mappings: `socketToMeeting[socketId]`, `socketToUserId[socketId]`, and `usernames[socketId]`.

## Client -> Server Events

### `join-call`
Join a meeting room.

Payload:

```json
{
  "meetingId": "1770090252592",
  "userId": "alice01",
  "username": "Alice"
}
```

Server behavior:

- Validates meeting existence and non-expired status
- Adds socket to room and connection map
- Updates participants list in DB if needed
- Emits `meeting-updated`, `user-joined`, `caption-module-status`
- Replays cached chat messages to joining user

Failure behavior:

- Emits `meeting-ended` with reason (`missing-meeting` or `ended`)
- Disconnects socket

### `signal`
Used for WebRTC SDP/ICE relay.

Args:

- `toId` (target socket id)
- `msg` (stringified SDP or ICE payload)

Server forwards as `signal` to target socket.

### `admin-end-meeting`
Host-only. Ends meeting for all users.

Payload:

```json
{
  "meetingId": "1770090252592",
  "userId": "host-user-id"
}
```

Server behavior:

- Verifies requester is host
- Finalizes meeting in DB (`isActive=false`, `endedAt`, `duration`)
- Emits `meeting-ended` to room
- Emits `force-removed` and disconnects room sockets

### `admin-mute-user`
Host-only. Force-mute a user.

Payload:

```json
{
  "meetingId": "1770090252592",
  "userId": "host-user-id",
  "targetSocketId": "socket-123"
}
```

Server emits:

- `force-mute` to target
- `peer-muted` to room

### `admin-unmute-user`
Host-only. Force-unmute a user.

Payload is same shape as `admin-mute-user`.

Server emits:

- `force-unmute` to target
- `peer-unmuted` to room

### `admin-remove-user`
Host-only. Remove a participant.

Payload:

```json
{
  "meetingId": "1770090252592",
  "userId": "host-user-id",
  "targetSocketId": "socket-123"
}
```

Server behavior:

- Emits `force-removed` to target and disconnects target
- Emits `user-left` to remaining room members
- Updates participant `leftAt`/`duration` in DB if user mapping exists
- Emits `meeting-updated`

### `admin-start-caption-module`
Host-only. Marks caption module enabled for room.

Payload:

```json
{
  "meetingId": "1770090252592",
  "userId": "host-user-id"
}
```

Server stores state and emits `caption-module-started` to room.

### `peer-muted`
Client self-reports local mute state.

Payload:

```json
{
  "meetingId": "1770090252592",
  "socketId": "socket-123"
}
```

Server re-broadcasts as `peer-muted` to room.

### `peer-unmuted`
Client self-reports local unmute state.

Payload shape same as `peer-muted`.

Server re-broadcasts as `peer-unmuted` to room.

### `live-caption`
Pushes live speech text updates.

Payload:

```json
{
  "meetingId": "1770090252592",
  "socketId": "socket-123",
  "username": "Alice",
  "text": "hello everyone",
  "isFinal": true
}
```

Server emits `live-caption-update` to room.

### `chat-message`
Room chat broadcast with simple in-memory persistence.

Args:

- `data` (message text)
- `sender` (display name)

Server behavior:

- Stores message in `messages[meetingId]`
- Emits `chat-message` to all sockets in room

### `user-username`
Update socket display name.

Payload: `"Alice"`

Server emits `user-username-update` to sockets in same room.

## Server -> Client Events

### `user-joined`
Emitted to each room socket when a user joins.

Args:

- `joinedSocketId`
- `clientsPayload` array

`clientsPayload` entry:

```json
{
  "socketId": "socket-123",
  "username": "Alice"
}
```

### `signal`
Relayed WebRTC data.

Args:

- `fromId`
- `message`
- `senderName`

### `user-left`
Participant disconnected/removed.

Payload: `socketId` (string)

### `meeting-updated`
Updated meeting object after participant or state changes.

### `meeting-ended`
Meeting has ended or join denied due to expiry.

Payload examples:

```json
{ "reason": "host-ended" }
```

```json
{ "reason": "ended" }
```

### `force-mute`
Target should disable local microphone.

Payload:

```json
{ "reason": "admin" }
```

### `force-unmute`
Target should enable local microphone.

Payload:

```json
{ "reason": "admin" }
```

### `force-removed`
User should exit meeting.

Payload examples:

```json
{ "reason": "removed-by-admin" }
```

```json
{ "reason": "meeting-ended" }
```

### `admin-action-error`
Host action failed.

Payload:

```json
{ "message": "Not authorized" }
```

### `peer-muted`
Someone is muted.

Payload:

```json
{ "socketId": "socket-123" }
```

### `peer-unmuted`
Someone is unmuted.

Payload shape same as `peer-muted`.

### `caption-module-started`
Caption module is now active in meeting.

Payload:

```json
{ "meetingId": "1770090252592" }
```

### `caption-module-status`
Sent to newly joined user with current caption module state.

Payload:

```json
{
  "meetingId": "1770090252592",
  "enabled": true
}
```

### `live-caption-update`
Caption line update from a participant.

Payload:

```json
{
  "socketId": "socket-123",
  "username": "Alice",
  "text": "hello everyone",
  "isFinal": false
}
```

### `chat-message`
Chat message replay/broadcast.

Args:

- `data`
- `sender`
- `socket-id-sender`

### `user-username-update`
Display name update for participant.

Args:

- `socketId`
- `username`

## Disconnect Behavior

When socket disconnects:

- Server emits `user-left` to peers in same room
- Removes socket from room connection list
- Updates participant `leftAt` and `duration` in DB when possible
- Cleans mapping caches (`usernames`, `socketToMeeting`, `socketToUserId`, `timeOnline`)

## Notes

- Socket chat storage (`messages`) is in-memory and not persisted across server restarts.
- Authorization for admin events is based on `meeting.hostId === payload.userId`.
- CORS for Socket.io is currently fixed to `http://localhost:3000`.
