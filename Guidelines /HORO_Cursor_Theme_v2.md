# HORO — Visual Theme Update
# Paste into Cursor Composer. Work through each block one at a time.
# Each block is self-contained. Commit after each one completes.

---

## CONTEXT

Website: horo-fashion.vercel.app (Next.js + Tailwind)
Brand: Artist-made t-shirts on Egyptian cotton. Premium, dark, editorial.

Design system summary:
- Background:  #0A0A0A  (Inkwell Black)
- Accent:      #C4A862  (Desert Gold)
- Text:        #F4EFE6  (Parchment) on dark, #0A0A0A on light
- Secondary:   #8C8C8C  (Mist) for metadata and labels
- Warmth:      #B85C38  (Ember) for gifts and specials only
- Display font: Cormorant Garamond (serif, weight 300/400/500)
- Body font:    DM Sans (weight 300/400)
- Data font:    DM Mono (prices, labels, specs, dates)

---

## BLOCK 1 — Design Tokens

Create the file `/styles/tokens.css` with this exact content:

```css
:root {
  /* Colors */
  --ink:        #0A0A0A;
  --ink-soft:   #111111;
  --ink-raised: #1A1A1A;
  --slate:      #4A4A4A;
  --mist:       #8C8C8C;
  --fog:        #BDBDBD;
  --parchment:  #F4EFE6;
  --sand:       #E8E0D0;
  --gold:       #C4A862;
  --gold-pale:  #D4BC82;
  --gold-muted: rgba(196,168,98,0.12);
  --ember:      #B85C38;

  /* Fonts */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
  --font-mono:  'DM Mono', monospace;

  /* Borders */
  --border-gold:  1px solid rgba(196,168,98,0.18);
  --border-soft:  1px solid rgba(196,168,98,0.10);
  --border-white: 1px solid rgba(255,255,255,0.06);

  /* Motion */
  --ease-brand: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-std:   cubic-bezier(0.4, 0, 0.2, 1);
  --t-fast:  150ms;
  --t-med:   300ms;
  --t-slow:  600ms;

  /* Spacing */
  --sp-1:  4px;  --sp-2:  8px;  --sp-3: 16px;
  --sp-4: 24px;  --sp-5: 40px;  --sp-6: 60px;
  --sp-7: 80px;  --sp-8: 120px;
}
```

Then import it at the top of `globals.css`:
```css
@import './tokens.css';
```

---

## BLOCK 2 — Google Fonts

In `app/layout.tsx`, add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

If the project uses `next/font/google` instead:

```ts
// lib/fonts.ts
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'

export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300','400','500','600'],
  style: ['normal','italic'],
  variable: '--font-serif',
  display: 'swap',
})
export const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['300','400','500'],
  variable: '--font-sans',
  display: 'swap',
})
export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400','500'],
  variable: '--font-mono',
  display: 'swap',
})
```

Apply in `app/layout.tsx`:
```tsx
import { serif, sans, mono } from '@/lib/fonts'
<body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
```

---

## BLOCK 3 — Global Base Styles

Add to `globals.css` (replace existing base styles completely):

```css
/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}

body {
  background: var(--ink);
  color: var(--fog);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.75;
  overflow-x: hidden;
}

/* Selection */
::selection { background: var(--gold); color: var(--ink); }

/* Scrollbar */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: var(--ink); }
::-webkit-scrollbar-thumb { background: var(--gold); }

/* Focus */
:focus-visible { outline: 1px solid var(--gold); outline-offset: 2px; }

/* Typography */
h1, h2, h3 {
  font-family: var(--font-serif);
  font-weight: 300;
  line-height: 0.95;
  color: var(--parchment);
  letter-spacing: -0.02em;
}
h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--parchment);
}
p {
  font-family: var(--font-sans);
  font-weight: 300;
  line-height: 1.8;
  color: var(--fog);
}
a { color: inherit; text-decoration: none; transition: color var(--t-fast) ease; }
a:hover { color: var(--gold); }
em, i { font-style: italic; color: var(--gold); }
strong { font-weight: 500; color: var(--parchment); }

/* Keyframes */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes spinSlow {
  to { transform: rotate(360deg); }
}
@keyframes goldPulse {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.8; }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Animation utility classes */
.anim-fade-up {
  animation: fadeUp var(--t-slow) var(--ease-brand) both;
}
.anim-fade-up-1 { animation: fadeUp var(--t-slow) var(--ease-brand) 80ms both; }
.anim-fade-up-2 { animation: fadeUp var(--t-slow) var(--ease-brand) 160ms both; }
.anim-fade-up-3 { animation: fadeUp var(--t-slow) var(--ease-brand) 240ms both; }
.anim-fade-up-4 { animation: fadeUp var(--t-slow) var(--ease-brand) 320ms both; }

.anim-spin-slow { animation: spinSlow 90s linear infinite; }
.anim-spin-slow-r { animation: spinSlow 120s linear infinite reverse; }
.anim-gold-pulse { animation: goldPulse 3s ease-in-out infinite; }

/* Skeleton loader */
.skeleton {
  background: linear-gradient(90deg,
    var(--ink-raised) 25%, var(--ink-soft) 50%, var(--ink-raised) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Reusable label style */
.brand-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gold);
}

/* Gold rule divider */
.gold-rule {
  display: block;
  width: 60px;
  height: 1px;
  background: var(--gold);
  margin: var(--sp-4) 0;
}
```

---

## BLOCK 4 — Tailwind Config

Replace the `extend` section in `tailwind.config.ts`:

```ts
extend: {
  colors: {
    ink:       { DEFAULT:'#0A0A0A', soft:'#111111', raised:'#1A1A1A' },
    gold:      { DEFAULT:'#C4A862', pale:'#D4BC82' },
    ember:     '#B85C38',
    parchment: '#F4EFE6',
    sand:      '#E8E0D0',
    fog:       '#BDBDBD',
    mist:      '#8C8C8C',
    slate:     '#4A4A4A',
  },
  fontFamily: {
    serif: ['var(--font-serif)', 'Georgia', 'serif'],
    sans:  ['var(--font-sans)',  'system-ui', 'sans-serif'],
    mono:  ['var(--font-mono)',  'monospace'],
  },
  transitionTimingFunction: {
    brand: 'cubic-bezier(0.16,1,0.3,1)',
  },
  animation: {
    'fade-up':    'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both',
    'spin-slow':  'spin 90s linear infinite',
    'gold-pulse': 'goldPulse 3s ease-in-out infinite',
  },
  keyframes: {
    fadeUp:    { from:{ opacity:'0', transform:'translateY(20px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
    goldPulse: { '0%,100%':{ opacity:'0.3' }, '50%':{ opacity:'0.8' } },
  },
}
```

---

## BLOCK 5 — GeoPattern Component

Create `/components/ui/GeoPattern.tsx`:

```tsx
// Brand motif — sacred geometry derived from Amira Youssef's practice
// Use at 6-12% opacity as background texture, 30% as watermark, 100% as hero accent
// ALWAYS in gold (#C4A862) or parchment (#F4EFE6). Never in other colors.

interface Props {
  size?: number
  color?: string
  opacity?: number
  rotate?: number
  animate?: boolean
  className?: string
}

export function GeoPattern({
  size = 400,
  color = '#C4A862',
  opacity = 0.12,
  rotate = 0,
  animate = false,
  className = '',
}: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 400 400"
      aria-hidden="true"
      className={className}
      style={{
        opacity,
        transform: `rotate(${rotate}deg)`,
        animation: animate ? 'spinSlow 90s linear infinite' : undefined,
        pointerEvents: 'none',
        flexShrink: 0,
      }}
    >
      {/* Rings */}
      <circle cx="200" cy="200" r="190" fill="none" stroke={color} strokeWidth="0.4"/>
      <circle cx="200" cy="200" r="150" fill="none" stroke={color} strokeWidth="0.4"/>
      <circle cx="200" cy="200" r="110" fill="none" stroke={color} strokeWidth="0.5"/>
      <circle cx="200" cy="200" r="70"  fill="none" stroke={color} strokeWidth="0.5"/>
      <circle cx="200" cy="200" r="32"  fill="none" stroke={color} strokeWidth="0.5"/>

      {/* Outer hexagon */}
      <polygon points="200,10 348,105 348,295 200,390 52,295 52,105"
        fill="none" stroke={color} strokeWidth="0.4"/>
      <polygon points="200,68 320,138 320,262 200,332 80,262 80,138"
        fill="none" stroke={color} strokeWidth="0.4"/>

      {/* Star triangles */}
      <polygon points="200,50 348,285 52,285"  fill="none" stroke={color} strokeWidth="0.35"/>
      <polygon points="200,350 52,115 348,115" fill="none" stroke={color} strokeWidth="0.35"/>

      {/* Axis lines */}
      <line x1="200" y1="10"  x2="200" y2="390" stroke={color} strokeWidth="0.25"/>
      <line x1="10"  y1="200" x2="390" y2="200" stroke={color} strokeWidth="0.25"/>
      <line x1="62"  y1="62"  x2="338" y2="338" stroke={color} strokeWidth="0.25"/>
      <line x1="338" y1="62"  x2="62"  y2="338" stroke={color} strokeWidth="0.25"/>

      {/* Center diamond */}
      <polygon points="200,158 242,200 200,242 158,200"
        fill="none" stroke={color} strokeWidth="0.9"/>

      {/* Flower of Life seed petals */}
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = (deg * Math.PI) / 180
        return (
          <circle key={i}
            cx={200 + 38 * Math.cos(r)}
            cy={200 + 38 * Math.sin(r)}
            r="38" fill="none" stroke={color} strokeWidth="0.35"
          />
        )
      })}
    </svg>
  )
}
```

---

## BLOCK 6 — Header / Nav

Find the header or nav component file. Fully replace its return JSX with:

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const LINKS = [
  { label: 'Shop',    href: '/shop' },
  { label: 'Themes',  href: '/#themes' },
  { label: 'Artists', href: '/artists' },
  { label: 'Gifts',   href: '/gifts' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? '14px 48px' : '24px 48px',
      background: scrolled ? 'rgba(10,10,10,0.94)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(196,168,98,0.12)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'padding 400ms var(--ease-brand), background 300ms ease',
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 22,
          fontWeight: 600, letterSpacing: '0.14em',
          color: 'var(--gold)', textTransform: 'uppercase', lineHeight: 1,
        }}>
          HORO
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.22em', color: 'var(--mist)',
          textTransform: 'uppercase', marginTop: 3,
        }}>
          Wearable Art · Egypt
        </div>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {LINKS.map(l => (
          <Link key={l.href} href={l.href} style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--mist)', padding: '8px 18px',
            borderBottom: '1px solid transparent',
            transition: 'color var(--t-fast) ease, border-color var(--t-fast) ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--parchment)'
            e.currentTarget.style.borderBottomColor = 'var(--gold)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--mist)'
            e.currentTarget.style.borderBottomColor = 'transparent'
          }}>
            {l.label}
          </Link>
        ))}

        {/* Primary CTA */}
        <Link href="/shop" style={{
          marginLeft: 16,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          background: 'var(--gold)', color: 'var(--ink)',
          padding: '11px 22px', textDecoration: 'none',
          transition: 'background var(--t-fast) ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
          Shop Now
        </Link>
      </nav>
    </header>
  )
}
```

---

## BLOCK 7 — Trust Strip (Announcement Bar)

Find the announcement bar component. Replace:

```tsx
'use client'
import { useState, useEffect } from 'react'

const MSGS = [
  { ar: 'الدفع عند الاستلام متاح',       en: 'COD Available — Pay on delivery' },
  { ar: 'استبدال مجاني خلال ١٤ يوم',     en: '14-Day Exchanges — No questions asked' },
  { ar: 'قطن مصري ١٠٠٪',               en: '100% Egyptian Cotton — 220 GSM' },
  { ar: 'فن مصنوع بأيدي الفنانين',       en: 'Artist-Made — Not mass produced' },
]

export function TrustStrip() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % MSGS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      background: 'var(--gold)',
      padding: '9px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 24,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--ink)', textAlign: 'center',
        transition: 'opacity 300ms ease',
      }}>
        <span dir="rtl" style={{ marginRight: 20 }}>{MSGS[i].ar}</span>
        <span style={{ opacity: 0.4, margin: '0 12px' }}>·</span>
        {MSGS[i].en}
      </span>
    </div>
  )
}
```

---

## BLOCK 8 — Hero Section

In `app/page.tsx` (or the Hero component file), replace the hero section:

```tsx
import { GeoPattern } from '@/components/ui/GeoPattern'

// Insert this as the first section on the homepage
<section style={{
  minHeight: '100vh',
  background: 'var(--ink)',
  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  padding: '140px 60px 80px',
  position: 'relative', overflow: 'hidden',
}}>
  {/* Background geometry */}
  <div style={{ position:'absolute', top:'8%', right:'4%', pointerEvents:'none' }}
       className="anim-spin-slow">
    <GeoPattern size={580} color="#C4A862" opacity={0.06} />
  </div>
  <div style={{ position:'absolute', bottom:'-10%', left:'-4%', pointerEvents:'none' }}
       className="anim-spin-slow-r">
    <GeoPattern size={340} color="#C4A862" opacity={0.04} />
  </div>

  {/* Content */}
  <div style={{ position:'relative', zIndex:1, maxWidth:820 }}>

    <span className="anim-fade-up brand-label" style={{ display:'block', marginBottom:24 }}>
      Artist-Made Wearable Art · Cairo, Egypt
    </span>

    <h1 className="anim-fade-up-1" style={{
      fontFamily: 'var(--font-serif)',
      fontSize: 'clamp(64px, 9vw, 120px)',
      fontWeight: 300, lineHeight: 0.92,
      letterSpacing: '-0.02em', color: 'var(--parchment)',
      marginBottom: 40,
    }}>
      Wear a story<br />that is actually<br />
      <em style={{ color:'var(--gold)', fontStyle:'italic' }}>yours.</em>
    </h1>

    <span className="gold-rule anim-fade-up-2" />

    <p className="anim-fade-up-2" style={{
      fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300,
      color: 'var(--mist)', lineHeight: 1.85,
      maxWidth: 460, marginBottom: 40,
    }}>
      Most printed tees feel generic the moment they arrive.
      HORO is different — every edition is made by a real Cairo artist,
      printed on premium Egyptian cotton, with a story behind it.
    </p>

    <div className="anim-fade-up-3"
         style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28 }}>

      <a href="/shop" style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        background: 'var(--gold)', color: 'var(--ink)',
        padding: '15px 36px', textDecoration: 'none', display: 'inline-block',
        transition: 'background var(--t-fast) ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--gold-pale)'}
      onMouseLeave={e => e.currentTarget.style.background='var(--gold)'}>
        Shop T-Shirts
      </a>

      <a href="/#themes" style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        background: 'transparent', color: 'var(--parchment)',
        border: '1px solid rgba(196,168,98,0.3)',
        padding: '15px 36px', textDecoration: 'none', display: 'inline-block',
        transition: 'border-color var(--t-fast) ease',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(196,168,98,0.7)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='rgba(196,168,98,0.3)'}>
        Find Your Theme
      </a>
    </div>

    <div className="anim-fade-up-4" style={{
      fontFamily: 'var(--font-mono)', fontSize: 10,
      letterSpacing: '0.15em', color: 'var(--mist)',
    }}>
      Starting 649 EGP &nbsp;·&nbsp; COD available &nbsp;·&nbsp; 14-day exchanges
    </div>
  </div>

  {/* Scroll indicator */}
  <div style={{
    position:'absolute', bottom:40, right:60,
    fontFamily:'var(--font-mono)', fontSize:9,
    letterSpacing:'0.2em', color:'var(--mist)',
    textTransform:'uppercase', writingMode:'vertical-rl',
    display:'flex', alignItems:'center', gap:10,
  }}>
    <div style={{ width:1, height:48, background:'var(--gold)', opacity:0.4 }} />
    Scroll
  </div>
</section>
```

---

## BLOCK 9 — Product Card

Find the product card component. Replace its JSX:

```tsx
import { GeoPattern } from '@/components/ui/GeoPattern'
import Image from 'next/image'

// Props expected: name, theme, price, href, image (string|null),
// artistName (optional), stock (number|null), isNew (boolean)

<a href={href}
  style={{
    display: 'block', textDecoration: 'none',
    background: 'var(--ink-soft)',
    border: 'var(--border-soft)',
    transition: `border-color var(--t-med) ease, transform var(--t-med) var(--ease-brand)`,
    overflow: 'hidden',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'rgba(196,168,98,0.35)'
    e.currentTarget.style.transform = 'translateY(-4px)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'rgba(196,168,98,0.10)'
    e.currentTarget.style.transform = 'translateY(0)'
  }}>

  {/* Image */}
  <div style={{ position:'relative', aspectRatio:'3/4', background:'var(--ink-raised)', overflow:'hidden' }}>
    {image ? (
      <Image src={image} alt={name} fill style={{ objectFit:'cover' }}
        sizes="(max-width:768px) 50vw, 33vw" />
    ) : (
      /* Placeholder — awaiting real product photo */
      <div style={{
        position:'absolute', inset:0,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <GeoPattern size={160} color="#C4A862" opacity={0.22} rotate={15} />
        <span style={{
          position:'absolute', bottom:16,
          fontFamily:'var(--font-mono)', fontSize:9,
          letterSpacing:'0.15em', color:'var(--mist)',
          textTransform:'uppercase',
        }}>
          Photo coming soon
        </span>
      </div>
    )}

    {/* Badges */}
    {isNew && (
      <div style={{
        position:'absolute', top:14, left:14,
        fontFamily:'var(--font-mono)', fontSize:9,
        letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--gold)', border:'var(--border-gold)',
        background:'var(--ink-soft)', padding:'4px 10px',
      }}>New</div>
    )}

    {/* Stock warning — only if stock ≤ 15 and not null */}
    {stock !== null && stock !== undefined && stock <= 15 && (
      <div style={{
        position:'absolute', bottom:14, left:14,
        fontFamily:'var(--font-mono)', fontSize:9,
        letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--ember)', background:'rgba(10,10,10,0.88)',
        padding:'4px 10px',
      }}>
        {stock <= 5 ? `Only ${stock} left` : `${stock} remaining`}
      </div>
    )}
  </div>

  {/* Info */}
  <div style={{ padding:'18px 20px 22px' }}>

    <div style={{
      fontFamily:'var(--font-mono)', fontSize:9,
      letterSpacing:'0.2em', color:'var(--gold)',
      textTransform:'uppercase', marginBottom:8,
      display:'flex', justifyContent:'space-between',
    }}>
      <span>{theme}</span>
      {artistName && <span style={{ color:'var(--mist)' }}>{artistName}</span>}
    </div>

    <div style={{
      fontFamily:'var(--font-serif)', fontSize:22, fontWeight:300,
      color:'var(--parchment)', lineHeight:1.1,
      letterSpacing:'-0.01em', marginBottom:14,
    }}>
      {name}
    </div>

    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, letterSpacing:'0.1em', color:'var(--fog)' }}>
        {price.toLocaleString()} EGP
      </span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)' }}>
        View →
      </span>
    </div>
  </div>
</a>
```

---

## BLOCK 10 — Section Headers

Everywhere a section title appears across the site, apply this pattern:

```tsx
// Section eyebrow (above every major heading)
<span style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 10, letterSpacing: '0.28em',
  textTransform: 'uppercase', color: 'var(--gold)',
  display: 'block', marginBottom: 16,
}}>
  {eyebrowText}
</span>

// Section heading
<h2 style={{
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(36px, 5vw, 64px)',
  fontWeight: 300, lineHeight: 0.95,
  letterSpacing: '-0.015em', color: 'var(--parchment)',
  marginBottom: 56,
}}>
  {headingText} <em style={{ color:'var(--gold)', fontStyle:'italic' }}>{italicPart}</em>
</h2>
```

Every section also needs top padding of 100px and a top border:
```tsx
style={{
  padding: '100px 60px',
  borderTop: '1px solid rgba(196,168,98,0.08)',
}}
```

---

## BLOCK 11 — Buttons (Global)

Find every button and CTA across the site. Apply one of these three variants:

**Primary (gold fill):**
```tsx
style={{
  fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  background: 'var(--gold)', color: 'var(--ink)',
  border: 'none', padding: '14px 32px', cursor: 'pointer',
  transition: 'background var(--t-fast) ease', display: 'inline-block',
}}
onMouseEnter={e => e.currentTarget.style.background='var(--gold-pale)'}
onMouseLeave={e => e.currentTarget.style.background='var(--gold)'}
```

**Outline (ghost):**
```tsx
style={{
  fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  background: 'transparent', color: 'var(--parchment)',
  border: '1px solid rgba(196,168,98,0.35)',
  padding: '14px 32px', cursor: 'pointer',
  transition: 'border-color var(--t-fast) ease', display: 'inline-block',
}}
onMouseEnter={e => e.currentTarget.style.borderColor='rgba(196,168,98,0.7)'}
onMouseLeave={e => e.currentTarget.style.borderColor='rgba(196,168,98,0.35)'}
```

**WhatsApp:**
```tsx
style={{
  fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase',
  background: '#25D366', color: '#fff',
  border: 'none', padding: '14px 32px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
  transition: 'background var(--t-fast) ease',
}}
onMouseEnter={e => e.currentTarget.style.background='#20bc5a'}
onMouseLeave={e => e.currentTarget.style.background='#25D366'}
```

---

## BLOCK 12 — Footer

Find the footer component. Replace fully:

```tsx
import { GeoPattern } from '@/components/ui/GeoPattern'

const COL = {
  Shop:  [['/shop',        'All Pieces'],   ['/gifts',        'Gifts'],
          ['/shop?tag=new','New Drops'],    ['/size-guide',   'Size Guide']],
  Brand: [['/about',       'About HORO'],   ['/artists',      'Meet Artists'],
          ['/journal',     'Drop Journal'], ['https://instagram.com/horo.egypt','Instagram']],
  Help:  [['/size-guide',  'Exchanges'],    ['/size-guide',   'Shipping'],
          [`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`,'WhatsApp'],
          ['/about',       'Privacy']],
}

<footer style={{ background:'var(--ink-soft)', borderTop:'1px solid rgba(196,168,98,0.15)', position:'relative', overflow:'hidden' }}>

  <div style={{ padding:'100px 60px', display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1fr', gap:60 }}>

    {/* Brand col */}
    <div>
      <div style={{ fontFamily:'var(--font-serif)', fontSize:30, fontWeight:600, letterSpacing:'0.1em', color:'var(--gold)', textTransform:'uppercase', marginBottom:16 }}>HORO</div>
      <p style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:300, color:'var(--mist)', lineHeight:1.85, maxWidth:260, marginBottom:32 }}>
        You deserve to wear a story that reflects who you really are.
        Artist-made. Egyptian cotton. Cairo.
      </p>

      {/* Email capture */}
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.22em', color:'var(--gold)', textTransform:'uppercase', marginBottom:12 }}>Get Drop Alerts</div>
      <div style={{ display:'flex', gap:2, marginBottom:14 }}>
        <input type="email" placeholder="your@email.com" style={{
          flex:1, background:'var(--ink)', border:'var(--border-gold)',
          color:'var(--fog)', padding:'10px 14px',
          fontFamily:'var(--font-mono)', fontSize:11, outline:'none',
        }}/>
        <button style={{
          background:'var(--gold)', color:'var(--ink)', border:'none',
          padding:'10px 16px', cursor:'pointer',
          fontFamily:'var(--font-mono)', fontSize:12,
        }}>→</button>
      </div>

      <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Add%20me%20to%20HORO%20drop%20alerts`}
        style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.14em', color:'#25D366', textDecoration:'none', textTransform:'uppercase' }}>
        📲 &nbsp;WhatsApp alerts instead
      </a>
    </div>

    {/* Link cols */}
    {Object.entries(COL).map(([group, links]) => (
      <div key={group}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.24em', color:'var(--gold)', textTransform:'uppercase', marginBottom:20 }}>{group}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {links.map(([href, label]) => (
            <a key={label} href={href} style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:300, color:'var(--mist)', textDecoration:'none', transition:'color var(--t-fast) ease' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--parchment)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--mist)'}>
              {label}
            </a>
          ))}
        </div>
      </div>
    ))}
  </div>

  {/* Bottom bar */}
  <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'18px 60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--slate)', letterSpacing:'0.12em' }}>
      © 2026 HORO · Cairo, Egypt
    </span>
    <div style={{ opacity:0.07 }}>
      <GeoPattern size={52} color="#C4A862" opacity={1}/>
    </div>
    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--slate)', letterSpacing:'0.12em' }}>
      COD · 14-day exchanges · Artist-made
    </span>
  </div>

</footer>
```

---

## BLOCK 13 — QA Checklist

Run through these checks in the browser before committing:

```
Fonts
  [ ] Headlines use Cormorant Garamond (check DevTools → Computed → font-family)
  [ ] Body/nav uses DM Sans
  [ ] Prices, tags, labels use DM Mono
  [ ] No Arial, Helvetica, Roboto visible anywhere

Colors
  [ ] Background is #0A0A0A — warm black, not pure #000
  [ ] All CTAs: gold background (#C4A862), ink text (#0A0A0A)
  [ ] Display headings: parchment (#F4EFE6), not pure white
  [ ] Ember (#B85C38) used only on gift/limited/special elements

Geometry
  [ ] GeoPattern SVG visible on hero at ~6% opacity
  [ ] GeoPattern used as placeholder in product cards with no image
  [ ] No GeoPattern in a non-gold color

Motion
  [ ] Hero: eyebrow → heading → rule → copy → CTAs stagger in (80ms gaps)
  [ ] Product cards: lift 4px on hover with smooth transition
  [ ] Nav: transparent → blurred-dark on scroll
  [ ] Trust strip: messages rotate every 4 seconds

Content
  [ ] WhatsApp link uses NEXT_PUBLIC_WHATSAPP_NUMBER env var
  [ ] Shipping bar says "COD Available" not "Free shipping over 2000 EGP"
  [ ] Stock counters only appear if stock is ≤ 15 AND not null
  [ ] "Other" collection renamed to "Studio Editions"
```

---

## ENV VARS NEEDED

Add to `.env.local`:

```
NEXT_PUBLIC_WHATSAPP_NUMBER=201XXXXXXXXX
```

Replace `201XXXXXXXXX` with the real number before any traffic.

---

*13 blocks. Work through them in order. Each block is independent — safe to commit after each one.*
