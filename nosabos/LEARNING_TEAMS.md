# Learning teams

Public teams shared between this app and another app that speaks the same events. No special relay. Users create a team with a name and npubs.

Source of truth is Nostr. Firestore in this app is only a local cache.

## Relays

Publish to both. A write succeeds if one accepts.

- `wss://relay.primal.net`
- `wss://relay.ditto.pub`

## Event kind

Kind `30078`. This is a parameterized replaceable event: the latest event from the same author, kind, and `d` tag replaces the older one. Always keep the newest `created_at` per `kind:pubkey:d`.

Sign with the user's Nostr key. A NIP-07 signer or a local `nsec` is fine. The signing pubkey must match the account npub.

## Team

The creator signs this. Include the creator and every teammate in `p` tags, as 64-character hex pubkeys.

```json
{
  "kind": 30078,
  "content": "{\"name\":\"Weekend Study\",\"createdAt\":1710000000}",
  "tags": [
    ["d", "learning-team:<32-hex-id>"],
    ["t", "learning-team"],
    ["name", "Weekend Study"],
    ["p", "<creator-hex>"],
    ["p", "<member-hex>"]
  ]
}
```

The id is 32 hex characters. Adding an npub puts that person on the team immediately. There is no accept step.

To rename a team, its creator publishes a newer event with the same `d` tag,
the new `name` tag and content name, and the current active `p` tags. Other apps
should display the name from the newest event at that address.

Find a user's teams:

```json
{ "kinds": [30078], "#t": ["learning-team"], "#p": ["<user-hex>"], "limit": 100 }
```

Ignore events whose `d` starts with `learning-team-left:`. Ignore events with a `deleted` tag.

A copyable address is an `naddr` for kind `30078`, the creator pubkey, identifier `learning-team:<id>`, and the two relays above.

## Progress

Each user signs one event for their own progress. Opening Teams publishes it. While Teams is open, publish again about 700ms after score, XP, level, goal, or companion changes. Also publish when creating a team.

```json
{
  "kind": 30078,
  "content": "<json below>",
  "tags": [
    ["d", "learning-progress"],
    ["t", "learning-progress"]
  ]
}
```

```json
{
  "schemaVersion": 2,
  "targetLang": "es",
  "xp": 40,
  "score": 72,
  "scoreScale": "0-100",
  "scoreLevel": "A2",
  "level": "A2",
  "proficiency": { "es": "A2" },
  "goal": 20,
  "dailyGoalXp": 20,
  "dailyXp": 10,
  "streak": 3,
  "answeredStepsCount": 12,
  "progressPercent": 50,
  "name": "Ada",
  "companion": { "name": "Luna", "type": "cat", "level": 2, "health": 80 },
  "updatedAt": 1710000000
}
```

`score` is the current language's 0–100 practice score. `level` is the curriculum level. `goal` and `dailyGoalXp` are the same daily XP target. `progressPercent` is today's XP divided by that goal, capped at 100. `companion` is optional display data: name, type, level, health 0–100.

Only trust `score` as 0–100 when `schemaVersion` is at least 2 and `scoreScale` is `"0-100"`. Older events may use `score` as a copy of XP.

Load teammates:

```json
{ "kinds": [30078], "#d": ["learning-progress"], "authors": ["<hex>", "<hex>"], "limit": 50 }
```

Use the caller's live local snapshot for their own row. Use the published event for everyone else.

## Leave

Only the creator can replace the team event. A member leaves by signing their own event.

```json
{
  "kind": 30078,
  "content": "",
  "tags": [
    ["d", "learning-team-left:<creator-hex>:<team-id>"],
    ["t", "learning-team-left"],
    ["a", "30078:<creator-hex>:learning-team:<team-id>"]
  ]
}
```

A leave counts when its `created_at` is greater than or equal to the team event's `created_at`. Hide that member. If the viewer left, hide the team. Re-adding someone requires the creator to publish the team again with a newer `created_at`.

Query leaves with `#d` set to those leave identifiers.

## Delete

The creator republishes the same team event, still including member `p` tags, plus a `deleted` tag. Keeping the `p` tags lets members receive the replacement and drop the team. Do not treat a deleted event as a live team.

## What the other app must do

1. Publish and read the team event on both relays.
2. Show a team to anyone in its `p` tags, unless they have a newer leave.
3. Publish `learning-progress` for the signed-in user.
4. Read teammates' `learning-progress` events instead of this app's database.
5. Honor leave and `deleted` the same way.

Queries can take up to 7 seconds. If every relay rejects a write, show that the update was not accepted.
