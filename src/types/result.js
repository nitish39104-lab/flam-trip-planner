/**
 * The exact structured shape we ask the model for, and the shape our UI
 * is built around. Designed BEFORE writing the prompt (Step 1 of the guide).
 *
 * @typedef {Object} Stop
 * @property {string} id           - stable unique id, generated client-side after parsing
 * @property {string} time         - e.g. "9:00 AM" or "Morning" (model's best guess)
 * @property {string} name         - name of the place / activity
 * @property {string} description  - 1-2 sentence description of what to do there
 * @property {string} category     - one of: "food" | "sightseeing" | "activity" | "transport" | "rest"
 *
 * @typedef {Object} Day
 * @property {number} day          - 1-indexed day number
 * @property {string} title        - short theme for the day, e.g. "Old Town & Harbor"
 * @property {Stop[]} stops
 *
 * @typedef {Object} Trip
 * @property {string} title        - overall trip title
 * @property {string} destination
 * @property {Day[]} days
 *
 * Top-level model response shape:
 * @typedef {Object} TripResult
 * @property {Trip} trip
 */

// Nothing to export at runtime — this file exists purely to document and
// pin down the contract that validateResult.js checks against.
export {};
