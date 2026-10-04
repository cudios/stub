import { doc, collection } from "../../vendor/firebase.js";
import { db } from "../core/firebase.js";

export const refs = Object.freeze({
  event: (eventId) => doc(db, "events", eventId),
  secrets: (eventId) => doc(db, "events", eventId, "private", "codes"),
  code: (code) => doc(db, "codes", code),
  attendees: (eventId) => collection(db, "events", eventId, "attendees"),
  attendee: (eventId, passId) => doc(db, "events", eventId, "attendees", passId),
  edits: (eventId) => collection(db, "events", eventId, "edits"),
  edit: (eventId, id) => doc(db, "events", eventId, "edits", id),
  scans: (eventId) => collection(db, "events", eventId, "scans"),
  scan: (eventId, id) => doc(db, "events", eventId, "scans", id),
  reviews: (eventId) => collection(db, "events", eventId, "reviews"),
  review: (eventId, id) => doc(db, "events", eventId, "reviews", id)
});
