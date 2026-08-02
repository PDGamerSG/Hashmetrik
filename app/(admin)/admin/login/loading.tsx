/**
 * Nothing, on purpose.
 *
 * The staff login sits inside the `/admin` segment, so without this it would
 * inherit that area's dashboard skeleton and open with a flash of a page
 * nobody signed in can see yet. It has one query of its own — is there already
 * a session — and no list to hold a place for.
 */
export default function Loading() {
  return null;
}
