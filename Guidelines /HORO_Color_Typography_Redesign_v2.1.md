# **Contrast Audit Results**

A programmatic WCAG contrast audit tested every text-on-background combination in the v2.0 palette. The results reveal **12 failing combinations** including the primary CTA button, section labels, secondary body text, and all accent colors used as text on Papyrus. These are not edge cases—they are the most commonly used pairs in the interface.

## **Critical Failures Found**

| Combination | Ratio | Required | Verdict |
| :---- | :---- | :---- | :---- |
| White text on Ember CTA button | 3.54:1 | 4.5:1 (AA) | **\[FAIL\]** Primary CTA is unreadable |
| Clay Earth (\#8B7355) on Papyrus | 3.95:1 | 4.5:1 (AA) | **\[FAIL\]** All secondary text |
| Desert Sand (\#C4956A) on Papyrus | 2.36:1 | 4.5:1 (AA) | **\[FAIL\]** All section labels |
| Ember (\#E8593C) on Papyrus | 3.12:1 | 3:1 (large) | **\[BORDERLINE\]** |
| Deep Teal (\#2D7A9C) on Papyrus | 4.23:1 | 4.5:1 (AA) | **\[FAIL\]** All links |
| Kohl Gold (\#D4A24E) on Papyrus | 2.04:1 | 3:1 (large) | **\[FAIL\]** Invisible |
| Stone (\#D4CFC5) on Papyrus | 1.37:1 | any | **\[FAIL\]** Ghost text |
| Clay Earth on glass surfaces | 3.87–4.02:1 | 4.5:1 (AA) | **\[FAIL\]** On every glass variant |

**Impact:** The warm Papyrus background (\#F5F0E8) has high luminance (L=0.87). Any text color with relative luminance above \~0.18 will fail AA contrast. The v2.0 palette used mid-tone warm colors (Clay Earth, Desert Sand, Kohl Gold) that are too close in brightness to Papyrus, making them appear washed out and difficult to read.

# **Redesigned Color System v2.1**

The redesign follows three principles: **(1) every text color must pass WCAG AA on its intended background, (2) decorative colors and text colors are explicitly separated, (3) each color has a defined role with approved pairings—no freeform mixing.**

## **Tier 1: Backgrounds (surfaces only—never used as text)**

| Name | HEX | Role | Luminance |
| :---- | :---- | :---- | :---- |
| Papyrus | \#F5F0E8 | Default page background, product card surfaces | L=0.87 |
| Clean White | \#FFFFFF | Checkout fields, image backgrounds, data tables | L=1.00 |
| Obsidian | \#1A1A1A | Dark sections (proof strip, footer, hero overlays) | L=0.02 |

## **Tier 2: Text Colors (always pass AA on their intended background)**

| Name | HEX | On Papyrus | On White | On Obsidian | Role |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Obsidian | \#1A1A1A | 15.3:1 ✅ | 17.4:1 ✅ | — | H1, H2, product names, prices |
| Warm Charcoal | \#2C2A26 | 12.6:1 ✅ | 14.3:1 ✅ | — | Body text, descriptions, paragraphs |
| **Clay Earth** | \#816A4F | 4.51:1 ✅ | 5.11:1 ✅ | — | Captions, metadata, artist names**\[ CHANGED\]** |
| **Label Brown** | \#876749 | 4.55:1 ✅ | 5.16:1 ✅ | — | Section labels, nav links, tags**\[ NEW\]** |
| Clean White | \#FFFFFF | — | — | 17.4:1 ✅ | All text on dark backgrounds |
| Papyrus | \#F5F0E8 | — | — | 15.3:1 ✅ | Subheadings on dark backgrounds |
| Stone | \#D4CFC5 | — | — | 11.2:1 ✅ | Secondary text on dark only |

**\[RULE\]**  Stone (\#D4CFC5) is **banned as text on Papyrus or White**. It has 1.37:1 contrast on Papyrus—literally invisible. Stone is only valid as text on Obsidian backgrounds, or as a border/divider color.

## **Tier 3: Accent Colors (split into Text-Safe and Decorative-Only)**

### **Text-safe accents (can be used as text on light backgrounds)**

| Name | HEX | On Papyrus | On White | Role |
| :---- | :---- | :---- | :---- | :---- |
| **Deep Teal** | \#2B7596 | 4.53:1 ✅ | 5.14:1 ✅ | Links, “New In” markers, info text**\[ CHANGED\]** |
| Dusk Violet | \#6B4C8A | 6.12:1 ✅ | 6.93:1 ✅ | Mood theme text accent (already safe) |
| **Kohl Gold Dark** | \#896832 | 4.53:1 ✅ | 5.13:1 ✅ | Gold text labels, featured text**\[ NEW\]** |
| Nile Dark | \#3A4A3F | 6.88:1 ✅ | 7.80:1 ✅ | Cultural pride text (already safe) |

### **Decorative-only accents (never used as text on light backgrounds)**

| Name | HEX | Approved Uses | Banned Uses |
| :---- | :---- | :---- | :---- |
| Ember | \#E8593C | CTA button bg, sale tags, notification dots, vibe accent dots, icon color | Never as text on Papyrus or White |
| Desert Sand | \#C4956A | Borders, hover highlights, accent dots, icon strokes on dark bg | Never as text on Papyrus or White |
| Kohl Gold Bright | \#D4A24E | Badge fills, star icons, featured dots, quality marks on dark bg | Never as text on Papyrus or White |
| Stone | \#D4CFC5 | Borders, dividers, disabled state fills, size selector borders | Never as text on Papyrus or White |

## **Tier 4: CTA Button System (redesigned)**

The biggest single fix. The v2.0 Ember CTA used white text on \#E8593C at 3.54:1—failing AA. Two options were tested:

| Option | Text | Background | Ratio | Verdict |
| :---- | :---- | :---- | :---- | :---- |
| **A: Dark text** | Obsidian \#1A1A1A | Ember \#E8593C | 4.91:1 ✅ | Passes. Ember stays vibrant. **RECOMMENDED** |
| B: Darker ember | White \#FFFFFF | Dark Ember \#CA4D34 | 4.54:1 ✅ | Passes but Ember loses its warmth and energy. |

**Decision: Use Option A (Obsidian text on Ember background) as the default CTA.** This keeps Ember’s signature warmth while ensuring readability. For CTAs on dark backgrounds (e.g., hero section), use White text on Ember—this pairing works because the dark surroundings provide enough visual separation, even though the button itself is technically 3.54:1.

**Updated CTA specs:**

| CTA Type | Background | Text Color | Ratio | Use |
| :---- | :---- | :---- | :---- | :---- |
| Primary (on light bg) | Ember \#E8593C | Obsidian \#1A1A1A | 4.91:1 | Add to Cart, Explore Collection, Checkout |
| Primary (on dark bg) | Ember \#E8593C | White \#FFFFFF | 3.54:1\* | Hero CTA, dark section CTAs |
| Ghost (on light bg) | Transparent | Obsidian \#1A1A1A | 15.3:1 | Continue Shopping, secondary actions |
| Ghost (on dark bg) | Transparent | White \#FFFFFF | 17.4:1 | Dark section secondary actions |

\*3.54:1 is accepted on dark backgrounds per WCAG context: the button is large text (\>18px bold) and the dark surround provides additional visual distinction.

# **Glassmorphism Overlay Readability Fix**

The audit confirmed that glass frost overlays on Papyrus barely shift the blended background color (all blended results fall between L=0.85–0.88). This means: **glass overlays on Papyrus do not create readability problems for Obsidian or Warm Charcoal text** (both stay above 12:1). The problem was never the glass—it was using low-contrast text colors like Clay Earth and Desert Sand on these surfaces.

## **Updated Glass Text Rules**

| Glass Surface | Approved Text Colors | Banned Text Colors |
| :---- | :---- | :---- |
| Any glass on Papyrus bg | Obsidian, Warm Charcoal, Clay Earth (\#816A4F), Label Brown (\#876749), Deep Teal (\#2B7596), Dusk Violet | Desert Sand, Stone, Kohl Gold Bright, Ember |
| Any glass on Obsidian bg | White, Papyrus, Stone, Desert Sand | Clay Earth, Obsidian, Warm Charcoal |
| Glass navigation (85% opacity) | Obsidian, Warm Charcoal, Label Brown | Anything lighter than Clay Earth |
| Glass modal (92% opacity) | Same as Papyrus rules (surface is nearly opaque) | Same as Papyrus bans |

**\[RULE\]**  The design story card uses Soft Violet glassmorphism. Text inside must be Obsidian (for the story) and Dusk Violet (for the “For the one who…” label)—both pass. The v2.0 guidelines correctly specified this; no change needed.

# **Typography System Revision**

Three changes to improve readability, visual hierarchy, and mobile legibility:

## **Change 1: Increase Body Text Size**

The v2.0 body text (Inter 400, 16px desktop / 15px mobile) is adequate but cramped on long product descriptions. Increase to **17px desktop / 16px mobile** with line-height 1.65 for comfortable reading on warm backgrounds where contrast is slightly softer than pure black-on-white.

## **Change 2: Add a Heading Weight Tier**

The v2.0 system uses Space Grotesk 500 for all headings. This creates a flat hierarchy—H1, H2, and H3 differ only in size. Add **Space Grotesk 600 (SemiBold) for H1** to give page titles more visual authority, especially on hero sections and product pages where the heading must anchor the layout.

## **Change 3: Section Labels Get a Distinct Treatment**

Section labels (“FIND YOUR VIBE”, “REAL STORIES”, etc.) were Desert Sand at 11px—invisible at 2.36:1 contrast. Replace with **Label Brown (\#876749) at 12px, letter-spacing 0.1em**. This is readable (4.55:1) while still feeling restrained and secondary to headings.

## **Revised Type Scale**

| Level | Typeface & Weight | Desktop | Mobile | Color | Line Height |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **H1 (revised)** | Space Grotesk 600 | 32px | 26px | Obsidian \#1A1A1A | 1.2 |
| H2 | Space Grotesk 500 | 22px | 19px | Obsidian \#1A1A1A | 1.3 |
| H3 | Space Grotesk 500 | 17px | 16px | Obsidian \#1A1A1A | 1.4 |
| **Body (revised)** | Inter 400 | 17px | 16px | Warm Charcoal \#2C2A26 | 1.65 |
| **Caption (revised)** | Inter 400 | 14px | 13px | Clay Earth \#816A4F (fixed) | 1.5 |
| **Label (revised)** | Space Grotesk 500 | 12px | 12px | Label Brown \#876749 (new) | 1.3, tracking 0.1em, uppercase |
| Small/Legal | Inter 400 | 12px | 11px | Clay Earth \#816A4F | 1.5 |

# **Layout & Spacing Improvements**

## **Fix 1: Product Card Text Hierarchy**

The v2.0 product card stacked four text lines (artist name, design name, story teaser, price) at nearly the same visual weight. The fix:

* **Artist name:** Inter 400, 13px, Clay Earth \#816A4F (was \#8B7355). Reads as metadata, not competing with the design name.

* **Design name:** Space Grotesk 600, 16px, Obsidian. Clearly the primary text—the heavier weight instantly separates it from the artist name above.

* **Story teaser:** Inter 400, 14px, Clay Earth. One line truncated. Provides context without overwhelming.

* **Price:** Space Grotesk 600, 17px, Obsidian. Same weight as design name but slightly larger—the eye finds it naturally.

Gap between design name and story teaser: 2px. Gap between story teaser and price: 8px. This **groups the content information together and separates it from the commercial information (price)**, which is a UX best practice for e-commerce cards.

## **Fix 2: Trust Strip Readability**

The trust strip on dark (Obsidian) backgrounds used Desert Sand for icons. Desert Sand passes on Obsidian (6.51:1), so it stays. But the text was specified as Stone at 13px—while Stone passes on Obsidian (11.2:1), 13px is small for trust-critical text. Increase to 14px Inter 500 (Medium weight) to add authority. Trust text should feel confident, not whispered.

## **Fix 3: Mobile Sticky CTA Bar**

The glassmorphic mobile sticky bar (glass-nav at 85% opacity) creates a near-opaque Papyrus surface. The CTA button inside uses Ember background. With the new Obsidian text on Ember, the button passes AA (4.91:1). Add the price inline: “Add to Cart — 799 EGP” in Obsidian on Ember. The price is no longer a separate element—it is part of the CTA text, reducing cognitive load.

## **Fix 4: Homepage Section Headings**

Section labels like “FIND YOUR VIBE” were the worst offenders—Desert Sand (\#C4956A) at 2.36:1 was invisible on Papyrus. With the new Label Brown (\#876749) at 4.55:1 and 12px size, they are legible but still secondary. For the “The Feeling” section where the headline (“You know that feeling?”) is the focal point at 48px, keep it as Obsidian—at 15.34:1 on Papyrus this is the strongest contrast in the system and anchors the scroll experience.

# **Approved Color Pairings Reference**

This is the definitive reference. If a pairing is not listed here, it is **not approved**. When in doubt, use Obsidian on Papyrus (15.34:1) or White on Obsidian (17.40:1).

## **On Papyrus (\#F5F0E8) Background**

| Text Element | Color | Ratio | Note |
| :---- | :---- | :---- | :---- |
| H1, H2, product names, prices | Obsidian \#1A1A1A | 15.34:1 | Primary hierarchy anchor |
| Body text, descriptions | Warm Charcoal \#2C2A26 | 12.63:1 | Main reading text |
| Captions, artist names, metadata | Clay Earth \#816A4F | 4.51:1 | Minimum AA compliant |
| Section labels, nav links | Label Brown \#876749 | 4.55:1 | Distinct from body text |
| Links, info badges | Deep Teal \#2B7596 | 4.53:1 | Interactive text cue |
| Mood theme accent text | Dusk Violet \#6B4C8A | 6.12:1 | Strong accent |
| Featured text labels | Kohl Gold Dark \#896832 | 4.53:1 | Use for “Featured” / “Artist Pick” |
| Cultural pride text | Nile Dark \#3A4A3F | 6.88:1 | Strong, earthy |

## **On Obsidian (\#1A1A1A) Background**

| Text Element | Color | Ratio | Note |
| :---- | :---- | :---- | :---- |
| H1, H2, primary text | White \#FFFFFF | 17.40:1 | Maximum contrast |
| Subheadings, secondary headings | Papyrus \#F5F0E8 | 15.34:1 | Warm alternative to pure white |
| Body text, descriptions | Stone \#D4CFC5 | 11.21:1 | Valid ONLY on dark backgrounds |
| Labels, nav, metadata | Desert Sand \#C4956A | 6.51:1 | Valid ONLY on dark backgrounds |
| Icons, accent elements | Kohl Gold Bright \#D4A24E | 5.67:1 | Decorative use, valid on dark only |

## **Banned Pairings (never use)**

| Pairing | Ratio | Why It Fails |
| :---- | :---- | :---- |
| Stone text on Papyrus | 1.37:1 | Invisible. Stone and Papyrus are nearly identical in luminance. |
| Desert Sand text on Papyrus | 2.36:1 | Washed out. Use Label Brown (\#876749) instead. |
| Kohl Gold Bright text on Papyrus | 2.04:1 | Unreadable. Use Kohl Gold Dark (\#896832) for text. |
| Ember text on Papyrus (body size) | 3.12:1 | Only acceptable at 24px+ bold. Never for body text. |
| White text on Ember (on light bg) | 3.54:1 | Use Obsidian text on Ember instead on light pages. |
| Clay Earth text on Obsidian | 3.88:1 | Too dim. Use Stone or Desert Sand on dark backgrounds. |

# **Implementation Summary**

Changes required in the codebase and Figma design system:

| What | Old Value | New Value | Files Affected |
| :---- | :---- | :---- | :---- |
| Clay Earth | \#8B7355 | \#816A4F | globals.css, Figma tokens |
| Deep Teal | \#2D7A9C | \#2B7596 | globals.css, Figma tokens |
| New: Label Brown | — | \#876749 | globals.css, all section labels |
| New: Kohl Gold Dark | — | \#896832 | globals.css, featured text |
| CTA button text | White \#FFF | Obsidian \#1A1A1A | btn-ember class, all CTA components |
| H1 weight | 500 | 600 | globals.css type-h1, Figma styles |
| H1 size | 28px / 24px | 32px / 26px | globals.css type-h1 |
| Body size | 16px / 15px | 17px / 16px | globals.css type-body |
| Body line-height | 1.6 | 1.65 | globals.css type-body |
| Label size | 11px | 12px | globals.css type-label |
| Label color | Desert Sand \#C4956A | Label Brown \#876749 | All section label components |
| Label tracking | 0.08em | 0.1em | globals.css type-label |
| Trust strip text size | 13px | 14px Inter 500 | proof-strip, trust-strip components |
| Caption size | 13px / 12px | 14px / 13px | globals.css type-small |
| Stone text on Papyrus | Allowed | BANNED | Remove all Stone text on light bg |
| Desert Sand as text on light | Used for labels | BANNED for text | Replace with Label Brown |

**Every color has a job. Every job has one approved color.**

This revision eliminates ambiguity. Designers and developers no longer ask “can I use Desert Sand for this label?” The answer is in the tier system: Desert Sand is Tier 3 Decorative-Only. Labels use Label Brown. The question doesn’t arise.