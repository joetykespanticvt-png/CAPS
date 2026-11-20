# CAPS Database Schema (Cloud Firestore)

Firestore is NoSQL, so this file documents the structure the app uses.
It is not enforced by the database.

## users/{uid}
Created in register.html (and login.html as a fallback).
| Field | Type | Notes |
|---|---|---|
| uid | string | Firebase Auth user ID |
| firstName | string | |
| middleName | string | added when the profile is edited |
| lastName | string | |
| fullName | string | |
| email | string | |
| mobile | string | |
| address | string | |
| picture | string | profile photo, set in profile.html |
| role | string | "resident" or "admin" |
| createdAt | timestamp | |

## reports/{reportId}
Created in dashboard.html.
| Field | Type | Notes |
|---|---|---|
| title | string | |
| description | string | |
| category | string | |
| purok | string | |
| status | string | Pending (default), Under Review, In Progress, Resolved |
| authorId | string | uid of the resident |
| authorName | string | |
| authorInitials | string | |
| upvoters | array of strings | uids; the author is added automatically |
| mediaCount | number | number of attached photos |
| createdAt | timestamp | |

### reports/{reportId}/media/{mediaId}
| Field | Type | Notes |
|---|---|---|
| type | string | "image" |
| data | string | compressed JPEG as base64 data URL |
| order | number | display order |
| authorId | string | |
| createdAt | timestamp | |

## comments/{commentId}
| Field | Type | Notes |
|---|---|---|
| reportId | string | the report being commented on |
| text | string | |
| authorId | string | |
| authorName | string | |
| authorInitials | string | |
| createdAt | timestamp | |

## notifications/{notificationId}
| Field | Type | Notes |
|---|---|---|
| toUid | string | resident uid, or "admin" for the admin inbox |
| type | string | comment, upvote, status, new_report |
| reportId | string | related report |
| text | string | message shown to the user |
| read | boolean | |
| fromUid | string | who triggered it |
| createdAt | timestamp | |