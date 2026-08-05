# Design

Two worlds live in this repository, and they do not mix.

- **`app/(site)`** — the public marketing pages. Printed matter: bone paper, ink
  type, Newsreader for display, column rules, tick scales. Unchanged, and out of
  scope for anything below. Its tokens are the first half of `app/globals.css`.
- **`app/(app)` and `app/(admin)`** — everything behind a sign-in. A departure
  board. Documented here, from what was built. Seed key `impeccable:ebf44196`,
  emitted as a comment at the top of `<body>` in both signed-in root layouts
  (`components/app/direction-contract.tsx`).

---

## The world

The product's first principle is that the queue is the product: what is waiting
on the person reading is what they came for. A departures hall answered that
question for far more people, far earlier, than any dashboard — a dark field,
one line per thing that is happening, the time it happens, and a lamp saying
whether it is on time.

Every record in this product is a departure. A deliverable waiting on a client, a
call at eleven, a milestone due Friday, a lead that landed four minutes ago. So:

| The board | The product |
| --- | --- |
| The field | The page you work on |
| The chassis | The rail, and the head of each page |
| A slat | One record — a lead, a project, a reading |
| A lit flap | The one value that is showing: a selected filter, a primary key, a current nav row |
| A lamp | A status |
| The hinge seam | The line across a slat that says it can turn over |

What it refuses: the card-grid-with-KPI-tiles arrangement every agency portal
ships. Cards are the lazy container; a queue drawn as tiles cannot be scanned.

## Palette

The board's palette is the site's own tokens **inverted**, scoped to `.board`
(set on `<body>` in both signed-in roots). This is the honest mapping rather than
a shortcut: on paper `ink` was the frame and `bone` was the surface you worked
on; on a board the field is dark and a lit flap is the bright thing. Inverting
the two keeps every existing surface's *meaning* while replacing its colour, and
that is why twenty pages of `text-ink` / `bg-bone-2` / `border-ash` landed the
right way round without being rewritten.

| Token | Board value | Role | Contrast |
| --- | --- | --- | --- |
| `--color-bone` | `#121114` | the field | — |
| `--color-bone-2` | `#1a191e` | a slat, lifted off the field | — |
| `--color-ink` | `#f4f1ea` | lit: type on the field, and the face of a showing flap | 16.9:1 on the field |
| `--color-slate` | `#979089` | secondary type on the field | 6.1:1 |
| `--color-ash` | `#2b2930` | the seam between slats | — |
| `--color-haze` | `#46424a` | secondary type on a lit flap | 8.6:1 |
| `--color-haze-2` | `#6a6570` | notes on a lit flap | 5.0:1 |
| `--color-chassis` | `#0a090c` | the case: rail, page head, cut slots | — |
| `--color-coral` | `#ff5f4d` | the lamp for "waiting on you" | 6.2:1 |
| `--color-gold` | `#f8cf6b` | the lamp for "running", and the chart line | — |
| `--color-go` | `#64d493` | cleared. The only colour not on the mark | — |

Both lamps are a half-step brighter than the printed brand, which is what a
colour has to do to read as *lit* rather than as painted.

### The hall lights

The same board in a bright hall: `[data-theme="light"] .board`. Every rule of the
world survives the switch, which is the test of whether it is a world or a colour
scheme — the case is still deeper than the field, the showing flap is still the
inverse of the field, and the lamps are still the only saturated colour.

**At night the board is read by light. In daylight it is read by relief.** That
sentence is the whole of this theme, and the first two cuts of it did not have
that sentence. They lightened the dark values and stopped, which left the field
(`#e9e7e2`), a slat (`#fbfaf7`) and the seam (`#d2cec6`) inside six percent of
each other: the readings band, the cards and the ground they sat on were one
wash, and the only shapes with any authority left were the black rail and the
black page head. Warm grey with brown type on it. Nobody chose that; it is what
lightening a dark theme produces.

| Token | Daylight | Note |
| --- | --- | --- |
| `--color-bone` | `#dcdad4` | the field — a panel, not paper |
| `--color-bone-2` | `#fdfcfa` | a slat, near white, sitting proud of it |
| `--color-ink` | `#15141a` | still means *showing* — now dark |
| `--color-slate` | `#5a564f` | 6.2:1 |
| `--color-ash` | `#c6c1b7` | the seam, and the strongest line on the object |
| `--color-chassis` | `#cbc6bd` | the recess: housings and channels |
| `--slot-face` | `#ffffff` | what a cut slot shows: the paper behind |
| `--color-coral` | `#ad2e1d` | the *legend*, 5.5:1 |
| `--color-gold` | `#6a5010` | 5.9:1 |
| `--color-go` | `#146b45` | 5.0:1 |

Four things follow from the sentence, and every value above is one of them.

1. **The field steps down and a slat steps up**, to eleven points of lightness
   between them rather than three. A slat is an object lying on a panel.
2. **Depth is drawn.** `--shadow-sheet` is a hard white top edge, a tight contact
   shadow and a wide ambient one — the three a real object in a lit room casts. A
   near-white slat has no glow to lift it and nothing else to work with.
3. **The seam gets crisper**, because in a lit hall it is the line the eye runs
   down when it scans a queue.
4. **The lamps stay lamps.** See below.

### A lamp and its legend are two things

They were one token, which you only get away with on a dark field. Under the hall
lights the legend is *text* and owes a reader 4.5:1, and deepening it that far
turns gold into olive and coral into brick — which is what drained the first cut
of this theme of all its colour. The lamp is not text. It is a light on an
instrument, it answers to the 3:1 a graphical object owes, and it has no business
being dimmed to suit the word beside it.

So the light is published separately as `--color-lamp-coral` / `-gold` / `-go`
and stays on the brand: `#e2412c`, `#cf8f07`, `#0f9a63` in daylight, and the
palette's own values at night, where nothing had to give. Everything that is a
*graphic* takes them — the lamp, the chart's line and wash, the urgent reading's
coral bloom, the alert's rule and tint, the focus ring, the coral meter fill.
Everything that is a *word* takes `--color-coral` / `-gold` / `-go`.

The same correction applies inside the case. "The case does not take the hall
lights" was written and then applied to the greys only, so in daylight the unread
badge on the rail and the pilot light in the page head were being drawn in the
deepened legend colours on a near-black frame, where they read as dirt. The
chassis scope hands all six back to their night values.

Anything made of *light* rather than of palette — the hinge, the field ruling,
the panel lip, a groove's shadow, a flap face, a cut slot's face, a key's lit
hover — is published as its own property (`--hinge-dark`, `--hinge-lip`,
`--board-rule`, `--board-wash`, `--panel-lip`, `--groove-shadow`, `--flap-top`,
`--flap-bottom`, `--flap-ink`, `--slot-face`, `--slot-line`, `--case-rule`,
`--key-face-hover`, `--key-ink-hover`, `--key-lip`) and reverses with the
lighting. Flap faces stay dark under both: the hall lights change the board, not
the printing on its slats.

Two of those are new because two objects were sharing one token and it only
showed up when the lights went on. `--slot-face` split the thing you *type into*
from the housing a selector *sits in*: both were `--color-chassis`, which is the
same colour on a dark board and put a grey box inside a white card on a bright
one — a form that looks disabled. A slot in a lit hall shows the paper behind the
panel and is the brightest surface on the page. And `--key-face-hover` split the
one control that lights when you reach for it from the gold it lit *with*: at
night the key still goes gold, and in daylight, where nothing gets brighter than
a near-white panel, it lights by deepening instead.

### The case is a frame, not a rectangle

The rail and the head of every page keep the night palette, and that is right —
a Solari case is dark anodised metal in every hall on earth. What was wrong is
that they were that colour and nothing else, which is defensible at night and
indefensible in daylight, where the same rectangle is a third of the screen and a
page head with a title in it read as a black slab welded to the top of the page.

`board-chassis` now carries `console-light`'s two blooms — under ten percent,
in the case's own lamp colours — over the same 96px cassette ruling the field
carries, so the frame is visibly part of the same machine. Both blooms are sized
in `rem` vertically and percent horizontally: a gradient whose height is a
percentage is a corner bloom on a 175px page head and a 700px stain down one edge
of a rail, and light falls across the top edge of a panel in both.

`case-edge` draws the join: a dark hairline with a lit one under it. One line was
enough at night, where there is a twelve-point drop either side of it anyway; in
daylight the case is near-black, the field is near-white, and one line between
them is a guillotine.

`components/app/theme.tsx` owns the switch. Three states — Daylight, Night, Auto
(the default, which follows the machine, including mid-session). `ThemeScript` is
a blocking inline script in `<head>` that resolves the stored choice and the
media query onto `data-theme` before first paint; both root `<html>` elements
carry `suppressHydrationWarning` because that attribute is meant to differ from
what the server sent. The control sits in the rail's footer and in the auth
header.

**Rules.** Coral is spent only on something asking for a decision. Green means
finished and nothing else. A status is never carried by colour alone: every lamp
has its word beside it.

## Type

One face, **Archivo**, at two widths — the way a real board is set. Loaded with
its `wdth` axis (`lib/fonts.ts`, `boardFontVariables`); the serif and the mono
stay behind on the public site.

| Recipe | Use | Setting |
| --- | --- | --- |
| `board-head` | page titles, the wordmark | wdth 78, 700, uppercase, −0.015em |
| `board-line` | record names, values, the clock | wdth 84, 600, tabular figures |
| `readout` | the big figures | wdth 80, 700, tabular, −0.02em |
| `plate` / `plate-lg` | column headings, labels, buttons, gate codes | wdth 92, 600, uppercase, 0.11em |

**The floor is 11px.** The printed system set its smallest labels at nine pixels
of tracked mono, which works in the margin of a document read at arm's length and
does not work as the only heading on a working page. `.label`, `.label-sm` and
`.label-xs` are re-cut inside `.board` so pages written against the old recipes
get the board's voice and the board's size without being rewritten.

## Surfaces

- **Slats** (`.slat`) carry a top highlight, a mid-height dark step and a lower
  lip — a machined seam catching light, not a card with a border.
- **The hinge** (`.hinge`) is drawn only where a value could turn over.
- **Depth** is `--shadow-slat` / `--shadow-flap`: a hairline top highlight over an
  offset soft drop. No warm shadows; there is no warm light here.
- **Radius** is 3px. Cut slots (inputs) are recessed with an inset shadow; keys
  (buttons) stand proud with an inset top highlight.
- **The field** (`.board-field`) carries a 96px vertical ruling at 3% and one
  overhead wash. It is the only decoration on the page.

## Marks

Each section of the rail carries a glyph on a plate. Two things about them.

**The plate is machined, not tinted.** It was described as "cut into the rail
when the row is unlit, cut into the lit flap when it is" and drawn as
`bg-ink/[0.07]`, a seven percent wash — which on a near-black rail is nothing, so
twelve grey glyphs floated in the dark with no plate under any of them. `plate-cut`
is the thing itself: a shadow along the top wall where the cut begins, a hairline
all the way round where the surface breaks, and the lit lower lip where the cut
returns. A recess in a near-black case cannot be drawn by going darker — there is
no darker — so it is drawn by its edges, which read at both lightings and on both
faces. The face is handed in as `--plate-face`, so the lit row is the same
machining upside down rather than a second treatment kept in step by hand.

**Every mark is an instrument, a place, or something moving through the board**,
and nothing else — the same vocabulary the rest of this world is built from. The
first set was legible and generic: five stock dashboard glyphs, three areas all
opening on the same `LayoutDashboard` square, and `FileText` standing in for the
whole public site. Now: Overview is a `Gauge` (the brand is *metrik*; the page
that answers "what is going on" is the dial you read first), Calls is a
`PhoneCall` because calls ring, Projects is a `Milestone` because that is what a
project is made of here, Accounts is a `KeyRound` because an account *is* a
sign-in, Content is a `Newspaper` because the site it publishes to is printed
matter, and Staff's own overview is `ListChecks` — a queue with things ticked off
it, which is a different question from the agency's dial. Rail glyphs are 17px at
stroke 1.75; lucide's 1.6 at 16px lands on half pixels and reads furry beside
Archivo at weight 600.

## Motion

One authored moment, and three signals.

1. **The board turns over.** Rows arrive with `slat-turn` — a 0.42s rotateX from
   the top edge, staggered 40ms by `:nth-child`, capped at ten steps. It is a
   `from` animation, so the settled state is what the server sent.
2. **The waiting lamp** blinks at 2.6s, and only on a reading that decays if
   nobody looks today. Never on a row in a queue: thirty blinking lamps is a
   fairground.
3. **The clock's colon** dims to 45% and never to zero.
4. **A reading is taken once.** The meter fills and the dial sweeps on arrival,
   both `from` animations for the same reason as the board itself.

The split-flap (`components/ui/split-flap-display.tsx`, installed from 21st.dev
and reworked onto these tokens) settles on first paint and turns only when its
text actually changes — which, in a layout that survives navigation, means the
status strip flips as you move between pages and sits still otherwise.

Everything above stops under `prefers-reduced-motion` and under
`html[data-motion="reduce"]`.

## The kit

`components/app/ui.tsx` is the whole vocabulary; every signed-in page imports
from it and nothing else.

`PageHeader` (destination line, optional flap status, IST clock) · `Readouts` /
`Readout` (the departures band; `urgent` lights the coral lamp) · `Meter` ·
`Dial` · `Rows` / `Row` · `Section` / `SectionTitle` · `Filters` / `Filter` (the
cassette selector) · `Card` · `Pill` (lamp + word) · `Empty` · `Alert` · `Detail`
/ `Details` · `Input` / `Select` / `Check` / `Fieldset` · `Button` / `ButtonLink`
/ `SubmitButton`.

Around it: `shell.tsx` (chassis rail + field), `nav-links.tsx` (marks on cut
plates, lit current row), `skeleton.tsx` (unlit slats, never a shimmer),
`board-clock.tsx`, `metric-chart.tsx` (gold line on the field).

### The dial

`components/ui/gauge.tsx`, installed from Watermelon UI (`gauge`) and reworked
the way `flip-clock` and `fluid-tabs` were. It earns its place: the brand is
*hash* plus *metrik*, this system takes everything structural from measuring
instruments, and a dial with a printed scale is the most direct statement of that
anywhere in the product. A bar says some of it is done; a dial says how much,
against a scale you can see.

What changed. The original was a full ring — a ring has no beginning, so there is
nothing to read it against, which makes it a donut chart. This is the half dial
an instrument actually has, with nine ticks on it, long at the quarters. Its nine
ways to colour one number (tailwind presets, gradients, a glow filter, multi-ring
mode, threshold pips) are two: the lit flap, and the coral that means somebody is
being asked for something. And its `motion` spring plus a React counter — a
render per frame, and blank until it hydrates — is now two registered custom
properties, `--dial-sweep` and `--dial-count`, with `stroke-dasharray` computed
off one and `counter()` printing the other, animated **from** zero by a single
keyframe. So `Dial` is a server component with no JavaScript at all, and the
settled state is what the server sent. It is the same trick the site's opening
counter uses. `pathLength="100"` is what lets the sweep be written as a
percentage instead of the four functions of circumference and offset the original
needed to reach the same dash array.

**`Meter` for a column, `Dial` for a headline.** Bars stacked in a column share a
left edge and can be compared down it, which is the whole reason not to print a
list of percentages. A dial is for the one proportion that is the headline of the
record it sits on — one per record. A grid of them is the tile wall this world
was written to refuse, which is also why the staff-side project editor keeps
bars: it has an editable progress field two inches away, and an instrument beside
a number you are typing is a second opinion nobody asked for.

## Rules a future change should keep

1. **The marketing site does not move.** Nothing in the board section of
   `globals.css` may edit a token above it.
2. **Add tokens, never re-point the inverted ones.** `text-ink` means *lit* in
   this world; the day it means something else, twenty pages quietly break.
3. **A status is a lamp and a word.** Never a coloured box, never colour alone.
4. **A graphic takes `--color-lamp-*`; a word takes `--color-*`.** They are the
   same value at night and they are not in daylight, and a chart or a lamp drawn
   in the legend colour is drawn in mud.
5. **Nothing in the kit hard-codes light.** No `rgba(255,255,255,…)` for a lip,
   no `rgba(0,0,0,…)` for a groove, no literal for a lit hover. Every one of
   those has a property, and a literal is a surface that will not reverse.
6. **Nothing under 11px.**
7. **One face, two widths.** A second typeface in here is a board somebody
   reprinted in a hurry.
8. **Motion is the board turning over, and a reading being taken.** Both are
   `from` animations. Not a hover effect, not a shimmer, not a spring in
   JavaScript where a registered property will do.
