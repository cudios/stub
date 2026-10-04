import { onSnapshot } from "../../vendor/firebase.js";
import { refs } from "./refs.js";
import { emit } from "../core/bus.js";
import { getMembership, saveMembership, getSeenConflicts, addSeenConflicts } from "../core/store.js";
import { buildAttendeeViews, sortAttendees } from "../domain/attendees.js";
import { detectConflicts, isLiveEntry } from "../domain/conflicts.js";
import { eventDays, todayKey } from "../domain/dates.js";

const COLLECTIONS = Object.freeze(["attendees", "edits", "scans", "reviews"]);
const sessions = new Map();

export function getSession(eventId) {
  if (!sessions.has(eventId)) sessions.set(eventId, new EventSession(eventId));
  return sessions.get(eventId);
}

export function closeSession(eventId) {
  sessions.get(eventId)?.stop();
  sessions.delete(eventId);
}

function databaseErrorMessage(error) {
  if (error.code === "permission-denied") return "The database refused access. Publish the rules from firestore.rules in the Firebase console.";
  return `Database error (${error.code || "unknown"}). Check the Firebase setup.`;
}

class EventSession {
  constructor(eventId) {
    this.eventId = eventId;
    this.event = null;
    this.eventMissing = false;
    this.secrets = null;
    this.records = Object.fromEntries(COLLECTIONS.map((name) => [name, new Map()]));
    this.pending = { event: false, secrets: false, ...Object.fromEntries(COLLECTIONS.map((name) => [name, new Set()])) };
    this.loaded = new Set();
    this.connected = false;
    this.lastSyncedAt = null;
    this.state = null;
    this.listeners = new Set();
    this.unsubscribers = [];
    this.scheduled = false;
    this.secretsWatched = false;
    this.start();
  }

  start() {
    const options = { includeMetadataChanges: true };
    const fail = (error) => {
      console.error(error);
      emit("toast", { message: databaseErrorMessage(error), tone: "bad", duration: 6000 });
    };

    this.unsubscribers.push(
      onSnapshot(refs.event(this.eventId), options, (snap) => {
        this.event = snap.exists() ? snap.data() : null;
        this.eventMissing = !snap.exists() && !snap.metadata.fromCache;
        this.pending.event = snap.metadata.hasPendingWrites;
        this.connected = !snap.metadata.fromCache;
        this.loaded.add("event");
        if (this.event) {
          saveMembership(this.eventId, { name: this.event.name, startDate: this.event.startDate, endDate: this.event.endDate });
        }
        this.schedule();
      }, fail)
    );

    for (const name of COLLECTIONS) {
      this.unsubscribers.push(
        onSnapshot(refs[name](this.eventId), options, (snap) => {
          const records = new Map();
          const pending = new Set();
          snap.forEach((docSnap) => {
            records.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            if (docSnap.metadata.hasPendingWrites) pending.add(docSnap.id);
          });
          this.records[name] = records;
          this.pending[name] = pending;
          this.loaded.add(name);
          this.schedule();
        }, fail)
      );
    }

    if (getMembership(this.eventId)?.role === "manager") this.watchSecrets();
  }

  watchSecrets() {
    if (this.secretsWatched) return;
    this.secretsWatched = true;
    this.unsubscribers.push(
      onSnapshot(refs.secrets(this.eventId), { includeMetadataChanges: true }, (snap) => {
        this.secrets = snap.exists() ? snap.data() : null;
        this.pending.secrets = snap.metadata.hasPendingWrites;
        this.schedule();
      }, () => {})
    );
  }

  schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.recompute();
    });
  }

  recompute() {
    const attendeeViews = buildAttendeeViews([...this.records.attendees.values()], [...this.records.edits.values()]);
    const attendees = new Map(attendeeViews.map((view) => [view.passId, view]));
    const edits = [...this.records.edits.values()];
    const scans = [...this.records.scans.values()].sort((a, b) => b.at - a.at);
    const conflicts = detectConflicts({ attendees, scans, edits });
    const reviews = new Map([...this.records.reviews.values()].map((review) => [review.conflictId, review]));
    const pendingCount = Number(this.pending.event) + Number(this.pending.secrets) + COLLECTIONS.reduce((sum, name) => sum + this.pending[name].size, 0);
    const pendingPasses = new Set([...this.pending.attendees, ...[...this.pending.edits].map((id) => this.records.edits.get(id)?.passId)]);

    if (pendingCount === 0 && this.connected) this.lastSyncedAt = Date.now();

    this.state = {
      eventId: this.eventId,
      event: this.event,
      eventMissing: this.eventMissing,
      secrets: this.secrets,
      days: this.event ? eventDays(this.event.startDate, this.event.endDate) : [],
      attendees,
      attendeeList: sortAttendees(attendeeViews),
      scans,
      edits,
      conflicts,
      reviews,
      pendingCount,
      pendingBreakdown: {
        scans: this.pending.scans.size,
        passes: this.pending.attendees.size + this.pending.edits.size,
        other: Number(this.pending.event) + Number(this.pending.secrets) + this.pending.reviews.size
      },
      pendingPasses,
      pendingScans: this.pending.scans,
      connected: this.connected,
      lastSyncedAt: this.lastSyncedAt,
      ready: this.loaded.size === COLLECTIONS.length + 1
    };

    this.announceNewConflicts();
    for (const listener of this.listeners) listener(this.state);
  }

  announceNewConflicts() {
    if (!this.state.ready) return;
    const today = todayKey();
    const seen = getSeenConflicts(this.eventId);
    const fresh = this.state.conflicts.filter((c) => c.day === today && !this.state.reviews.has(c.id) && !seen.has(c.id));
    if (fresh.length === 0) return;
    addSeenConflicts(this.eventId, fresh.map((c) => c.id));
    emit("conflict:new", { eventId: this.eventId, conflicts: fresh, state: this.state });
  }

  liveScansFor(passId) {
    return (this.state?.scans || []).filter((scan) => scan.passId === passId && isLiveEntry(scan));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    if (this.state) listener(this.state);
    return () => this.listeners.delete(listener);
  }

  stop() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.listeners.clear();
  }
}
