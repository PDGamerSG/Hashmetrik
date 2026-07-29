# HashMetrik — generation prompts (Google Flow)

Every photograph on the home page is currently a stock Unsplash frame. They are
cool-graded, Western, and glossy; the design system they sit in is warm paper,
near-black ink, a coral accent and measuring-instrument furniture. That mismatch
is what makes the page read as unfinished — not the layout.

This file is the replacement spec: 21 stills and 4 optional video loops, each
tied to the slot it fills.

---

## 0. Read this before generating

**Flow's aspect ratios are 16:9 and 9:16.** The page wants 4:5 and 4:3. So:

| Page wants | Generate in Flow as | Then |
| --- | --- | --- |
| 4:5 portrait | 9:16 | crop centre to 4:5 |
| 3:4 portrait | 9:16 | crop centre to 3:4 |
| 4:3 landscape | 16:9 | crop centre to 4:3 |

Every prompt below therefore says **"keep the subject inside the central [x]"** —
that is the region that survives the crop. Compose for it.

**Veo generates audio.** The loops here are silent decoration, so either add
`no dialogue, no music, room tone only` (already in the prompts) or mute in code.

**All stills are shot on the same imaginary roll.** That is the whole point. Do
not vary the house block below between prompts — consistency across 21 frames is
worth more than any single frame being better.

### THE HOUSE BLOCK — paste at the end of every image prompt

```
Photographic style: editorial documentary, 35mm film, Kodak Portra 400, natural
window light only. Muted warm palette — bone white, paper cream, warm grey and a
deep near-black; exactly one small accent of coral red somewhere in the frame.
No blue or teal colour grading, no orange-and-teal look. Matte contrast with
lifted blacks, fine visible film grain, slightly soft corners. Real working
people in plain unbranded clothes, mostly South Asian, Hyderabad India.
Negative: no glossy corporate stock look, no HDR, no lens flare, no bokeh balls,
no legible text, no logos, no brand marks on screens or walls, no watermark, no
neon, no blue screen glow, no stock-photo smiling at camera.
```

### THE VIDEO HOUSE BLOCK — paste at the end of every video prompt

```
Style: editorial documentary, 35mm film grain, natural window light, muted warm
bone-and-ink palette with one small coral accent. Locked-off tripod, no camera
move, no zoom, no push-in — only the subject moves, so the clip loops cleanly.
Matte contrast, lifted blacks. No dialogue, no music, room tone only. No text,
no logos, no captions, no watermark.
```

---

## 1. Hero contact sheet — 3 stills

Replaces `components/home/hero.tsx:11-33`. Three frames at staggered heights,
under a parallax. They read as a contact sheet, so they must look shot on one
day in one room.

**Generate 9:16 → crop to 3:4. Keep the subject inside the central 3:4.**
Save as `public/frames/strategy.jpg`, `reporting.jpg`, `review.jpg`.

### 1a — Strategy

```
A wall of pinned cream paper in a warm daylight studio: hand-drawn campaign
maps, funnel diagrams and printed charts, overlapping, some slightly crooked. A
woman in a plain charcoal shirt reaches up to move one card; a colleague sits on
the desk edge behind her, watching. Both seen three-quarters from behind, faces
partial. Late afternoon light rakes across the wall from the left, so the paper
edges cast small shadows. One card on the wall is coral red.
```
+ HOUSE BLOCK

### 1b — Reporting

```
Over-the-shoulder frame of a matte monitor in a dim warm office. The screen
shows a sparse analytics dashboard — thin dark line charts and bar charts on a
near-white background, one line picked out in red, all labels illegibly small. A
hand rests beside the keyboard on a paper printout of the same chart, annotated
in pencil. Window light from the right, screen glow kept warm and dim rather
than blue.
```
+ HOUSE BLOCK

### 1c — Review

```
Four people around a plain light-wood table in a Hyderabad office, mid-review.
Printed pages and a single laptop between them; one man is pointing at a
document, another is writing in a notebook. Nobody looks at the camera. Shot
from the corner of the table at seated eye level, one figure soft in the
foreground. Broad daylight through an unseen window on the left. A coral folder
sits on the table.
```
+ HOUSE BLOCK

---

## 2. Growth package pillars — 4 stills

Replaces the `image` fields in `lib/content.ts:69-110`. These are the biggest
photographs on the site — full-height panels that pin to the viewport, rendered
`aspect-4/5` on desktop and `aspect-4/3` on mobile.

**Generate 9:16 → crop to 4:5. Keep the subject inside the central square**, so
the mobile 4:3 crop does not decapitate anyone.
Save as `public/pillars/foundation.jpg`, `presence.jpg`, `growth.jpg`, `reach.jpg`.

### 2a — Brand Foundation (`01 / IDENTITY`)

```
Overhead-adjacent view of a studio desk laid out with brand identity work in
progress: printed logo variations in black on cream stock, torn colour swatch
strips, a type specimen sheet, a pencil and a steel ruler. A hand lays one
swatch card down at the edge of the arrangement. The single coral swatch sits
near the centre. Soft raking daylight from one side across the paper.
```
+ HOUSE BLOCK

### 2b — Digital Presence (`02 / CVR`)

```
A designer at a large matte display in a warm studio, reviewing website
wireframes — grey and white rectangular blocks, no legible text, no colour. To
the left of the keyboard, the same wireframes printed on paper and marked up in
pencil. Seen from behind and slightly above, the designer's head and shoulders
dark against the pale screen. Daylight from a window behind the monitor keeps
the screen glow warm, never blue.
```
+ HOUSE BLOCK

### 2c — Marketing Growth (`03 / ROAS`)

```
A media buyer at a two-monitor desk in a working office, one hand on a mouse,
leaning slightly forward. Both screens show sparse charts — thin dark lines and
small bars on near-white, one series in red, all figures illegibly small. A
printed weekly report sits beside the keyboard with a pencil across it. Warm
window light from the left; the rest of the room falls off into shadow.
```
+ HOUSE BLOCK

### 2d — Brand Reach (`04 / SOV`)

```
A founder being interviewed on camera in a plain warm-toned room: seated in a
simple chair, mid-sentence, hands open; a shotgun microphone on a boom edges
into the top of frame, and a softbox stands out of focus behind the camera
operator's shoulder in the foreground. Shot past the operator so the frame feels
observed rather than staged. Warm practical light, plain cream wall behind.
```
+ HOUSE BLOCK

---

## 3. Audiences — 8 stills

Replaces `lib/content.ts:132-173`. A grid of eight `aspect-4/5` cards, each
about 270px wide on screen. They are seen together, so evenness beats drama:
**one subject, one clear shape, no busy backgrounds.**

**Generate 9:16 → crop to 4:5.**
Save as `public/audiences/<slug>.jpg`.

### 3a — Restaurants & cafés
```
The empty interior of a small warm-lit Indian café mid-afternoon: bentwood
chairs, a marble counter, one server wiping down a table at the back, sunlight
falling in a hard diagonal across the floor. Shot at seated eye level from the
doorway.
```

### 3b — Healthcare & clinics
```
A calm, plain clinic corridor in daylight: cream walls, a row of empty waiting
chairs, a clinician in a plain white coat walking away from camera holding a
folder. No medical equipment in frame, no signage, no crowding.
```

### 3c — Real estate
```
A residential apartment interior under early morning light, unfurnished except
for one chair; tall windows, pale floor, a Hyderabad skyline soft and hazy
outside. A person stands at the window with their back to camera, small in the
frame.
```

### 3d — Startups
```
Four young founders around a folding table in a bare rented room, laptops open,
one standing and writing on a plain whiteboard covered in diagrams rather than
words. Cardboard boxes still stacked in the corner. Flat daylight.
```

### 3e — Ecommerce brands
```
A small packing bench in a warm daylight room: plain kraft cartons in a row, a
tape gun, a stack of address slips, two hands sealing one box. Shot from a
low three-quarter angle so the row of boxes recedes. One coral sticker on the
nearest carton.
```

### 3f — Fashion & jewellery
```
A rail of unbranded garments in muted neutral fabrics against a cream wall, a
hand reaching in to move one hanger aside. Shallow focus on the hand; the rest
of the rail falls soft. Warm side light, deep quiet shadows.
```

### 3g — B2B companies
```
Two people in plain shirts across a long table in a quiet meeting room, printed
documents between them, one sliding a page towards the other. Seen from the side
at table height. A blank cream wall behind, no screen, no branding.
```

### 3h — Personal brands
```
A single person seated alone in a warm room, mid-sentence to an unseen camera,
a small clip microphone on their collar and a softbox edge just visible at the
frame's border. Plain cream wall behind. Shot slightly off-axis so it reads as
a documentary frame, not a portrait.
```

All eight + HOUSE BLOCK.

---

## 4. Services — 6 stills

Replaces `lib/content.ts:180-229`. These only ever appear as a 17rem × 12rem
card floating under the cursor (`components/motion/cursor-preview.tsx:110`), for
about a second. So: **one high-contrast shape, read at thumbnail size, no fine
detail.** Anything intricate turns to mush.

**Generate 16:9 → crop to 4:3.**
Save as `public/services/<id>.jpg`.

### 4a — PR & reputation (`SOV`)
```
A single shotgun microphone on a boom, sharply lit against a dark falloff
background, the blurred shape of a seated speaker behind it. Almost graphic in
its simplicity.
```

### 4b — Influencer marketing (`REACH`)
```
A phone clamped to a small tripod in a warm room, seen from behind, framing a
soft out-of-focus person mid-gesture. The phone is the dark silhouette; the
room behind it is bright cream.
```

### 4c — Performance marketing (`ROAS`)
```
A tight crop of a single rising line chart on a matte screen — thin dark line on
near-white, one segment in red, no legible axis labels. Filling the frame.
```

### 4d — SEO (`RANK`)
```
A stack of printed pages on a cream desk seen from directly above, the top sheet
covered in a dense grid of grey text blocks with one line marked in red pencil.
No legible words.
```

### 4e — Website development (`CVR`)
```
A matte display filling the frame at a slight angle, showing a grey-and-white
wireframe of blocks and lines — no colour, no legible text. A pale room reflects
faintly in the glass.
```

### 4f — Social media (`ENG`)
```
Nine printed square photographs laid out in a 3×3 grid on a cream surface, seen
from above, edges not quite aligned. Muted warm imagery in each, one square
noticeably coral.
```

All six + HOUSE BLOCK.

---

## 5. Video — 4 loops (optional)

These need code changes, not just an asset swap — the current slots are
`next/image`. Highest-value first.

### 5a — Hero contact sheet, as three loops (best value)

The three hero frames already parallax at different speeds. Replacing them with
8-second silent loops turns the strongest part of the page into the strongest
part of the page. Generate 9:16, crop to 3:4, export ~6–8s, loop seamlessly by
choosing near-identical first and last frames.

**Strategy:**
```
Locked-off shot of a wall of pinned cream paper — campaign maps and hand-drawn
charts. A woman in a charcoal shirt steps into frame from the left, unpins one
card, considers it, and pins it a hand's width higher. She holds still. 8
seconds, one continuous action, no cuts. Afternoon light raking from the left.
```
+ VIDEO HOUSE BLOCK

**Reporting:**
```
Locked-off over-the-shoulder shot of a matte monitor showing a sparse line chart
on near-white, one series in red. A hand moves a cursor slowly across the chart,
pauses on a point, and withdraws. The paper printout beside the keyboard lifts
slightly in a draught. 8 seconds, no cuts.
```
+ VIDEO HOUSE BLOCK

**Review:**
```
Locked-off corner-of-the-table shot: four people mid-review over printed pages.
One slides a document across the table; another leans in and turns a page.
Nobody speaks to camera. 8 seconds, no cuts, the room otherwise still.
```
+ VIDEO HOUSE BLOCK

### 5b — Growth package pillar panels, as loops

The four pillar panels pin to the viewport as you scroll, so the image is on
screen for several seconds — the one place on the site where motion earns its
weight. Same four subjects as §2, each rewritten as a single 8-second action:

- **Foundation** — a hand lays swatch cards down one at a time onto a cream desk, last card coral.
- **Presence** — a designer scrolls a wireframe slowly up the screen, then stops.
- **Growth** — a chart on screen redraws itself as a hand rests still on the mouse.
- **Reach** — a founder mid-answer to an unseen interviewer, gesturing once, settling.

Each + VIDEO HOUSE BLOCK, and each **locked-off** so it loops.

### 5c — Do not shoot a hero background video

The hero already has `HeroField` — a live canvas of drifting measurement marks
that is the brand's own vocabulary in motion. A video plate behind it would
compete with it and cost a megabyte. Leave it.

### 5d — One 20-second studio reel (for `/book`, not the home page)

Only worth making once there is real studio footage to intercut. Flow's
Scene Builder can extend three 8-second beats into one clip: the wall of paper →
the two-monitor desk → the review table, each locked-off, cut on action.

---

## 6. After generating

1. Drop files into `public/frames/`, `public/pillars/`, `public/audiences/`, `public/services/`.
2. Swap the URLs in `lib/content.ts` and `components/home/hero.tsx:11-33` for the local paths.
3. Delete the `remotePatterns` block in `next.config.ts:9-13` — local files under
   `/public` do not need it, and leaving it open is a needless allowance.
4. Convert to AVIF/WebP before committing. Twenty-one film-grain JPEGs at full
   size will undo the page's load time; grain compresses badly, so check the
   pillar images especially.
5. Keep the `alt` text truthful to whatever actually got generated — several
   current `imageAlt` strings describe the Unsplash frame, not the new one.
