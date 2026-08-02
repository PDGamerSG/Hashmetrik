import Image from "next/image";
import Link from "next/link";
import { SubmitButton } from "@/components/app/button";
import { NavLinks, type NavLink } from "@/components/app/nav-links";

/**
 * The bar across the top of every signed-in page.
 *
 * Links are passed in rather than derived here, because which ones exist is a
 * question about the viewer's role and that answer belongs next to the session,
 * not in a component. `signOut` is passed for the same reason: the admin area
 * returns to its own login page, the rest to the public one.
 *
 * Sign-out is a form rather than a link because it changes state, and a link
 * that changes state is one prefetch away from signing people out by accident.
 *
 * Which link is *current* is the one thing this cannot answer, because a layout
 * renders once and never again — see `nav-links.tsx`.
 */
export type { NavLink };

export function AppNav({
  area,
  email,
  links,
  signOut,
}: {
  area: string;
  email: string;
  links: NavLink[];
  signOut: () => Promise<void>;
}) {
  return (
    /* Sticky, because these pages are long lists and the way out of one was
       previously at the top of a document somebody had scrolled to the bottom
       of. Bone rather than transparent: the rows underneath would otherwise
       travel through the links. */
    <header className="sticky top-0 z-40 border-b border-ash bg-bone/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo-hm.png"
            alt=""
            width={64}
            height={64}
            className="size-6 rounded-sheet object-cover"
          />
          <span className="font-display text-lg leading-none font-medium tracking-[-0.018em] text-ink">
            HashMetrik
          </span>
        </Link>

        {/* The area, set as a reading against the wordmark rather than as a
            second line of type: it is a label on what you are looking at, and
            the pages below no longer repeat it in their own headings. */}
        <span className="label-sm hidden border-l border-ash pl-5 text-slate sm:inline-block">
          {area}
        </span>

        <NavLinks area={area} links={links} />

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="hidden max-w-[22ch] truncate text-sm text-slate lg:inline">{email}</span>
          <form action={signOut}>
            <SubmitButton variant="quiet" size="sm" busyLabel="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
