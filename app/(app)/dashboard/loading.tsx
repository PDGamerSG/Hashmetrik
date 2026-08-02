import { PageSkeleton } from "@/components/app/skeleton";

/**
 * The instant half of every navigation in this area.
 *
 * Its presence is what lets `<Link>` swap the page the moment it is clicked
 * instead of holding the previous one until the server answers — see
 * `components/app/skeleton.tsx`.
 */
export default function Loading() {
  return <PageSkeleton />;
}
