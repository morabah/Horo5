import { useState, useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --ink:       #0A0A0A;
    --ink-soft:  #111111;
    --parchment: #F4EFE6;
    --sand:      #E8E0D0;
    --gold:      #C4A862;
    --gold-pale: #D4BC82;
    --ember:     #B85C38;
    --slate:     #4A4A4A;
    --mist:      #8C8C8C;
    --fog:       #BDBDBD;
    --white:     #FDFAF5;
    --serif:     'Cormorant Garamond', Georgia, serif;
    --sans:      'DM Sans', system-ui, sans-serif;
    --mono:      'DM Mono', monospace;
  }

  .horo-book {
    background: var(--ink);
    color: var(--parchment);
    font-family: var(--sans);
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px;
    background: rgba(10,10,10,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(196,168,98,0.15);
  }
  .nav-logo {
    font-family: var(--serif);
    font-size: 22px; font-weight: 600; letter-spacing: 0.12em;
    color: var(--gold); text-transform: uppercase;
  }
  .nav-sub {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.25em;
    color: var(--mist); text-transform: uppercase;
  }
  .nav-tabs {
    display: flex; gap: 4px;
  }
  .nav-tab {
    background: none; border: none; cursor: pointer;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--mist);
    padding: 6px 14px; border-radius: 2px;
    transition: all 0.2s;
  }
  .nav-tab:hover { color: var(--parchment); }
  .nav-tab.active {
    color: var(--gold);
    background: rgba(196,168,98,0.1);
  }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    justify-content: flex-end;
    padding: 80px 60px 60px;
    position: relative; overflow: hidden;
  }
  .hero-geo {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
  }
  .hero-eyebrow {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.3em;
    color: var(--gold); text-transform: uppercase;
    margin-bottom: 24px;
  }
  .hero-title {
    font-family: var(--serif); font-size: clamp(64px, 9vw, 120px);
    font-weight: 300; line-height: 0.9; letter-spacing: -0.02em;
    color: var(--parchment);
    margin-bottom: 40px;
  }
  .hero-title em { color: var(--gold); font-style: italic; }
  .hero-rule {
    width: 80px; height: 1px; background: var(--gold);
    margin-bottom: 24px;
  }
  .hero-desc {
    font-family: var(--sans); font-size: 15px; font-weight: 300;
    color: var(--mist); max-width: 480px; line-height: 1.8;
  }
  .hero-scroll {
    position: absolute; bottom: 40px; right: 60px;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
    color: var(--mist); text-transform: uppercase;
    writing-mode: vertical-rl; display: flex; align-items: center; gap: 12px;
  }
  .hero-scroll::before {
    content: ''; display: block;
    width: 1px; height: 60px; background: var(--gold); opacity: 0.5;
  }

  /* ── SECTIONS ── */
  .section {
    padding: 100px 60px;
    border-top: 1px solid rgba(196,168,98,0.1);
  }
  .section-label {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.3em;
    color: var(--gold); text-transform: uppercase;
    margin-bottom: 16px;
  }
  .section-title {
    font-family: var(--serif); font-size: clamp(36px, 5vw, 64px);
    font-weight: 300; line-height: 1.0; letter-spacing: -0.01em;
    color: var(--parchment); margin-bottom: 60px;
  }
  .section-title em { color: var(--gold); font-style: italic; }

  /* ── TYPOGRAPHY SECTION ── */
  .type-showcase { display: grid; gap: 2px; }
  .type-row {
    display: grid; grid-template-columns: 160px 1fr 200px;
    align-items: baseline; gap: 40px;
    padding: 28px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .type-meta { font-family: var(--mono); font-size: 10px; color: var(--mist); line-height: 1.6; }
  .type-meta strong { display: block; color: var(--fog); margin-bottom: 4px; }
  .type-spec { font-family: var(--mono); font-size: 10px; color: var(--slate); text-align: right; line-height: 1.6; }
  .type-d1 { font-family: var(--serif); font-size: 72px; font-weight: 300; color: var(--parchment); letter-spacing: -0.02em; line-height: 1; }
  .type-d2 { font-family: var(--serif); font-size: 48px; font-weight: 300; color: var(--parchment); letter-spacing: -0.01em; font-style: italic; }
  .type-h1 { font-family: var(--serif); font-size: 32px; font-weight: 500; color: var(--parchment); letter-spacing: 0.01em; }
  .type-h2 { font-family: var(--sans); font-size: 18px; font-weight: 500; color: var(--parchment); letter-spacing: 0.05em; text-transform: uppercase; }
  .type-body { font-family: var(--sans); font-size: 15px; font-weight: 300; color: var(--fog); line-height: 1.8; }
  .type-caption { font-family: var(--mono); font-size: 11px; color: var(--mist); letter-spacing: 0.15em; }
  .type-label { font-family: var(--mono); font-size: 10px; color: var(--gold); letter-spacing: 0.3em; text-transform: uppercase; }

  .font-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(196,168,98,0.12);
    padding: 40px;
    margin-top: 60px;
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px;
  }
  .font-specimen { }
  .font-name { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; margin-bottom: 20px; }
  .font-display-serif { font-family: var(--serif); font-size: 48px; font-weight: 300; color: var(--parchment); line-height: 1.1; }
  .font-display-sans { font-family: var(--sans); font-size: 32px; font-weight: 300; color: var(--parchment); line-height: 1.2; }
  .font-display-mono { font-family: var(--mono); font-size: 22px; color: var(--parchment); line-height: 1.4; }
  .font-alpha {
    font-family: var(--mono); font-size: 11px; color: var(--slate);
    margin-top: 16px; word-break: break-all; line-height: 1.6;
  }
  .font-weights { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
  .font-w-row { display: flex; justify-content: space-between; align-items: baseline; }

  /* ── COLORS ── */
  .palette-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 3px; }
  .color-swatch {
    position: relative; cursor: pointer;
    transition: transform 0.2s;
  }
  .color-swatch:hover { transform: scaleY(1.05); z-index: 2; }
  .swatch-bar { width: 100%; height: 120px; }
  .swatch-info { padding: 12px 0 0; }
  .swatch-name { font-family: var(--mono); font-size: 10px; color: var(--fog); display: block; }
  .swatch-hex { font-family: var(--mono); font-size: 9px; color: var(--mist); margin-top: 4px; display: block; }
  .swatch-role { font-family: var(--sans); font-size: 10px; color: var(--slate); margin-top: 4px; display: block; line-height: 1.4; }

  .color-meaning {
    margin-top: 60px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 2px;
  }
  .meaning-card {
    padding: 36px 40px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .meaning-swatch {
    width: 40px; height: 40px; border-radius: 50%;
    margin-bottom: 20px;
  }
  .meaning-title { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--parchment); margin-bottom: 10px; }
  .meaning-body { font-family: var(--sans); font-size: 13px; color: var(--mist); line-height: 1.7; }

  .color-combos { margin-top: 60px; }
  .combo-row { display: flex; gap: 3px; margin-bottom: 3px; }
  .combo-block {
    flex: 1; padding: 28px 24px;
    font-family: var(--serif); font-size: 20px;
    letter-spacing: 0.02em;
    display: flex; align-items: center; justify-content: space-between;
  }
  .combo-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; }

  /* ── IMAGERY ── */
  .imagery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .imagery-card {
    position: relative; overflow: hidden;
    aspect-ratio: 4/3;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(196,168,98,0.12);
    display: flex; flex-direction: column;
    justify-content: flex-end;
    padding: 32px;
  }
  .imagery-icon-area {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    opacity: 0.08;
  }
  .imagery-title { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--parchment); position: relative; z-index: 1; }
  .imagery-sub { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; margin-bottom: 10px; position: relative; z-index: 1; }
  .imagery-desc { font-family: var(--sans); font-size: 12px; color: var(--mist); line-height: 1.6; margin-top: 10px; position: relative; z-index: 1; }

  .do-dont { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-top: 3px; }
  .do-card, .dont-card { padding: 32px; }
  .do-card { background: rgba(196,168,98,0.05); border: 1px solid rgba(196,168,98,0.2); }
  .dont-card { background: rgba(184,92,56,0.04); border: 1px solid rgba(184,92,56,0.2); }
  .do-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; }
  .do-card .do-label { color: var(--gold); }
  .dont-card .do-label { color: var(--ember); }
  .do-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .do-list li { font-family: var(--sans); font-size: 13px; color: var(--fog); line-height: 1.5; display: flex; gap: 12px; align-items: flex-start; }
  .do-list li::before { content: '—'; color: var(--gold); flex-shrink: 0; margin-top: 1px; }
  .dont-card .do-list li::before { color: var(--ember); }

  .icon-system { margin-top: 60px; }
  .icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; margin-top: 32px; }
  .icon-tile {
    aspect-ratio: 1;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(196,168,98,0.1);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    padding: 20px 10px;
    transition: background 0.2s;
    cursor: default;
  }
  .icon-tile:hover { background: rgba(196,168,98,0.08); }
  .icon-tile svg { width: 28px; height: 28px; }
  .icon-tile-label { font-family: var(--mono); font-size: 9px; color: var(--mist); letter-spacing: 0.1em; text-align: center; }

  /* ── LAYOUT ── */
  .layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .layout-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 40px; position: relative; overflow: hidden;
  }
  .layout-preview {
    width: 100%; margin-bottom: 24px;
    border: 1px solid rgba(196,168,98,0.1);
    position: relative; overflow: hidden;
  }
  .layout-name { font-family: var(--serif); font-size: 22px; color: var(--parchment); margin-bottom: 8px; }
  .layout-use { font-family: var(--mono); font-size: 10px; color: var(--gold); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
  .layout-desc { font-family: var(--sans); font-size: 12px; color: var(--mist); line-height: 1.6; }

  .spacing-scale { margin-top: 60px; }
  .spacing-title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.25em; color: var(--gold); text-transform: uppercase; margin-bottom: 32px; }
  .spacing-row { display: flex; align-items: center; gap: 24px; margin-bottom: 12px; }
  .spacing-bar { background: var(--gold); height: 2px; opacity: 0.6; }
  .spacing-label { font-family: var(--mono); font-size: 10px; color: var(--mist); white-space: nowrap; }

  /* ── SOCIAL ── */
  .social-templates { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; }
  .template-wrap { display: flex; flex-direction: column; gap: 12px; }
  .template-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; }
  .template-card {
    position: relative; overflow: hidden;
    border: 1px solid rgba(196,168,98,0.12);
  }

  .post-sq { aspect-ratio: 1; background: var(--ink-soft); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; position: relative; }
  .post-story { aspect-ratio: 9/16; background: var(--ink-soft); display: flex; flex-direction: column; justify-content: flex-end; padding: 28px 22px; position: relative; }
  .post-wide { aspect-ratio: 16/9; background: var(--ink-soft); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; position: relative; }

  .post-geo { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.06; pointer-events: none; }
  .post-tag { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; margin-bottom: 8px; }
  .post-headline { font-family: var(--serif); font-size: 22px; font-weight: 300; color: var(--parchment); line-height: 1.2; margin-bottom: 8px; }
  .post-sub { font-family: var(--sans); font-size: 11px; color: var(--mist); }
  .post-logo { position: absolute; top: 20px; right: 20px; font-family: var(--serif); font-size: 14px; font-weight: 600; letter-spacing: 0.1em; color: var(--gold); text-transform: uppercase; }
  .post-handle { font-family: var(--mono); font-size: 9px; color: var(--mist); margin-top: 6px; }

  .story-cta {
    margin-top: 16px;
    background: var(--gold);
    padding: 10px 20px;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
    color: var(--ink); text-transform: uppercase;
    display: inline-block;
  }

  .email-preview {
    background: var(--white);
    border: 1px solid rgba(196,168,98,0.2);
    margin-top: 60px;
    overflow: hidden;
  }
  .email-header {
    background: var(--ink); padding: 32px 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .email-logo { font-family: var(--serif); font-size: 20px; font-weight: 600; letter-spacing: 0.12em; color: var(--gold); text-transform: uppercase; }
  .email-body { padding: 48px 40px; background: var(--white); }
  .email-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 0.25em; color: var(--gold); text-transform: uppercase; margin-bottom: 20px; }
  .email-headline { font-family: var(--serif); font-size: 36px; font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.01em; }
  .email-text { font-family: var(--sans); font-size: 14px; color: var(--slate); line-height: 1.8; margin-bottom: 32px; }
  .email-btn { display: inline-block; background: var(--ink); padding: 14px 36px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.15em; color: var(--gold); text-transform: uppercase; }
  .email-product-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; padding-top: 40px; border-top: 1px solid rgba(0,0,0,0.08); }
  .email-product { }
  .email-product-img { width: 100%; aspect-ratio: 3/4; background: var(--sand); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .email-product-name { font-family: var(--serif); font-size: 16px; color: var(--ink); }
  .email-product-price { font-family: var(--mono); font-size: 12px; color: var(--slate); margin-top: 4px; }
  .email-footer { padding: 24px 40px; background: var(--ink); font-family: var(--mono); font-size: 10px; color: var(--mist); letter-spacing: 0.1em; display: flex; justify-content: space-between; align-items: center; }

  /* ── MOTION TOKENS ── */
  .token-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 40px; }
  .token-card {
    padding: 32px 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .token-name { font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em; color: var(--gold); text-transform: uppercase; margin-bottom: 16px; }
  .token-value { font-family: var(--mono); font-size: 18px; color: var(--parchment); margin-bottom: 8px; }
  .token-desc { font-family: var(--sans); font-size: 12px; color: var(--mist); line-height: 1.5; }

  /* ── FOOTER ── */
  .book-footer {
    padding: 60px;
    border-top: 1px solid rgba(196,168,98,0.2);
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-logo { font-family: var(--serif); font-size: 28px; font-weight: 300; letter-spacing: 0.1em; color: var(--gold); }
  .footer-meta { font-family: var(--mono); font-size: 10px; color: var(--mist); letter-spacing: 0.15em; text-align: right; line-height: 1.8; }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse-gold { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }

  .fade-up { animation: fadeUp 0.6s ease forwards; }
`;

// ─── Sacred Geometry SVG ────────────────────────────────────────
function GeoPattern({ size = 400, color = "#C4A862", opacity = 0.12, rotate = 0, animate = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400"
      style={{ opacity, transform: `rotate(${rotate}deg)`, ...(animate ? { animation: 'spin-slow 60s linear infinite' } : {}) }}>
      {/* Outer circle */}
      <circle cx="200" cy="200" r="180" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="200" cy="200" r="120" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="200" cy="200" r="60"  fill="none" stroke={color} strokeWidth="0.5" />
      {/* Hexagon */}
      <polygon points="200,20 352,110 352,290 200,380 48,290 48,110" fill="none" stroke={color} strokeWidth="0.5" />
      <polygon points="200,80 320,150 320,250 200,320 80,250 80,150" fill="none" stroke={color} strokeWidth="0.5" />
      {/* Star of David inner */}
      <polygon points="200,60 340,270 60,270" fill="none" stroke={color} strokeWidth="0.4" />
      <polygon points="200,340 60,130 340,130" fill="none" stroke={color} strokeWidth="0.4" />
      {/* Cross lines */}
      <line x1="200" y1="20" x2="200" y2="380" stroke={color} strokeWidth="0.3" />
      <line x1="20" y1="200" x2="380" y2="200" stroke={color} strokeWidth="0.3" />
      <line x1="73" y1="73" x2="327" y2="327" stroke={color} strokeWidth="0.3" />
      <line x1="327" y1="73" x2="73" y2="327" stroke={color} strokeWidth="0.3" />
      {/* Center diamond */}
      <polygon points="200,160 240,200 200,240 160,200" fill="none" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

// ─── Layout Preview Components ──────────────────────────────────
function LayoutMockHero() {
  return (
    <div style={{ background: '#111', height: 200, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 20 }}>
      <div style={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', opacity: 0.08 }}>
        <GeoPattern size={160} color="#C4A862" opacity={1} />
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#C4A862', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>New Drop</div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: '#F4EFE6', lineHeight: 1, marginBottom: 8, fontWeight: 300 }}>Artist<br /><em style={{ color: '#C4A862' }}>Chapter</em></div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#8C8C8C', letterSpacing: '0.15em' }}>649 EGP · COD · 14-day exchange</div>
    </div>
  );
}
function LayoutMockProduct() {
  return (
    <div style={{ background: '#111', height: 200, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <div style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 60, height: 80, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GeoPattern size={50} color="#C4A862" opacity={0.5} />
        </div>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#C4A862', letterSpacing: '0.2em', marginBottom: 6 }}>Career · Bold</div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, color: '#F4EFE6', marginBottom: 6, fontWeight: 300 }}>The Hustler</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8C8C8C', lineHeight: 1.6 }}>For the person who wears ambition before talking about it.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: '#C4A862', padding: '8px 14px', fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#0A0A0A', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}>Collect Piece</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#8C8C8C', letterSpacing: '0.1em', textAlign: 'center' }}>649 EGP</div>
        </div>
      </div>
    </div>
  );
}
function LayoutMockArtist() {
  return (
    <div style={{ background: '#111', height: 200, display: 'grid', gridTemplateColumns: '80px 1fr', gap: 0 }}>
      <div style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#222', border: '1px solid rgba(196,168,98,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GeoPattern size={36} color="#C4A862" opacity={0.6} />
        </div>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#C4A862', letterSpacing: '0.2em' }}>Cairo, Egypt · Sacred geometry</div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: '#F4EFE6', fontWeight: 300 }}>Amira Youssef</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8C8C8C', lineHeight: 1.6 }}>Explores the intersection of sacred geometry and modern identity.</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#C4A862', letterSpacing: '0.1em', marginTop: 4 }}>→ View drops</div>
      </div>
    </div>
  );
}
function LayoutMockGrid() {
  const themes = ['Mood','Career','Couple','Events','Places','Seasons'];
  return (
    <div style={{ background: '#111', height: 200, padding: 16 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#C4A862', letterSpacing: '0.2em', marginBottom: 12 }}>Browse by Theme</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
        {themes.map(t => (
          <div key={t} style={{ background: '#1a1a1a', padding: '10px 12px', borderBottom: '1px solid rgba(196,168,98,0.15)' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: '#F4EFE6', fontWeight: 300 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function HoroVisualIdentity() {
  const [activeSection, setActiveSection] = useState('type');
  const [copiedColor, setCopiedColor] = useState(null);

  const sections = [
    { id: 'type',   label: 'Typography' },
    { id: 'color',  label: 'Color' },
    { id: 'imagery',label: 'Imagery' },
    { id: 'layout', label: 'Layout' },
    { id: 'social', label: 'Social' },
  ];

  const palette = [
    { name: 'Inkwell',   hex: '#0A0A0A', css: '--ink',       role: 'Primary background. The canvas for everything.' },
    { name: 'Night',     hex: '#111111', css: '--ink-soft',   role: 'Elevated surface. Cards, overlays.' },
    { name: 'Slate',     hex: '#4A4A4A', css: '--slate',      role: 'Body text on light. Dividers.' },
    { name: 'Mist',      hex: '#8C8C8C', css: '--mist',       role: 'Secondary text. Metadata. Labels.' },
    { name: 'Fog',       hex: '#BDBDBD', css: '--fog',        role: 'Primary body text on dark.' },
    { name: 'Parchment', hex: '#F4EFE6', css: '--parchment',  role: 'Headlines on dark. Off-white.' },
    { name: 'Sand',      hex: '#E8E0D0', css: '--sand',       role: 'Light background. Product context.' },
    { name: 'Gold',      hex: '#C4A862', css: '--gold',       role: 'Brand accent. CTAs. Highlights.' },
    { name: 'Ember',     hex: '#B85C38', css: '--ember',      role: 'Warmth. Gift. Special editions.' },
  ];

  function copyHex(hex) {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  }

  const typeRows = [
    { meta: { name: 'Display / Serif', font: 'Cormorant Garamond Light', use: 'Hero headings, product names, chapter titles' }, el: <div className="type-d1">The Chapter</div>, spec: { size: '72–120px', weight: '300', tracking: '-0.02em' } },
    { meta: { name: 'Display Italic', font: 'Cormorant Garamond Light Italic', use: 'Emphasis, pull quotes, artist bios' }, el: <div className="type-d2">Artist Edition</div>, spec: { size: '36–72px', weight: '300i', tracking: '-0.01em' } },
    { meta: { name: 'Heading', font: 'Cormorant Garamond Medium', use: 'Section titles, collection headers' }, el: <div className="type-h1">Sacred Geometry</div>, spec: { size: '24–40px', weight: '500', tracking: '0.01em' } },
    { meta: { name: 'Subheading', font: 'DM Sans Medium Caps', use: 'Category labels, nav items, tags' }, el: <div className="type-h2">Wearable Art</div>, spec: { size: '14–18px', weight: '500', tracking: '0.05em' } },
    { meta: { name: 'Body', font: 'DM Sans Light', use: 'Product descriptions, editorial copy' }, el: <div className="type-body">For the person who wears ambition before talking about it. Cairo has always had artists — HORO puts their work on your body.</div>, spec: { size: '14–16px', weight: '300', tracking: '0', line: '1.8' } },
    { meta: { name: 'Caption / Mono', font: 'DM Mono Regular', use: 'Prices, specs, system labels, metadata' }, el: <div className="type-caption">649 EGP · Limited Edition · DTG Print</div>, spec: { size: '10–12px', weight: '400', tracking: '0.15em' } },
    { meta: { name: 'Brand Label', font: 'DM Mono Regular All-Caps', use: 'Section eyebrows, tags, drop labels' }, el: <div className="type-label">New Drop · Horoscope Collection</div>, spec: { size: '10px', weight: '400', tracking: '0.3em' } },
  ];

  const iconDefs = [
    { label: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { label: 'Sun', path: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6z' },
    { label: 'Moon', path: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
    { label: 'Flame', path: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' },
    { label: 'Gem', path: 'M6 3h12l4 6-10 13L2 9z M2 9h20 M6 3l4 6 M18 3l-4 6' },
    { label: 'Layers', path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { label: 'Feather', path: 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9' },
    { label: 'Eye', path: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="horo-book">

        {/* ── NAV ── */}
        <nav className="nav">
          <div>
            <div className="nav-logo">HORO</div>
            <div className="nav-sub">Visual Identity System · 2026</div>
          </div>
          <div className="nav-tabs">
            {sections.map(s => (
              <button key={s.id} className={`nav-tab ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="hero">
          <div className="hero-geo">
            <div style={{ position: 'absolute', top: '10%', right: '8%', animation: 'spin-slow 90s linear infinite' }}>
              <GeoPattern size={500} color="#C4A862" opacity={0.07} />
            </div>
            <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', animation: 'spin-slow 120s linear infinite reverse' }}>
              <GeoPattern size={300} color="#C4A862" opacity={0.05} />
            </div>
          </div>

          <div className="hero-eyebrow">Visual Identity System — HORO Brand Book</div>
          <h1 className="hero-title">
            Wear a<br /><em>Story.</em><br />Build a Brand.
          </h1>
          <div className="hero-rule" />
          <p className="hero-desc">
            This system defines how HORO looks, feels, and speaks across every touchpoint — from product page to packaging, from Instagram post to the card inside a gift box. Every element is designed to signal one thing: this is not a print shop.
          </p>
          <div className="hero-scroll">Scroll to explore</div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* TYPOGRAPHY                                        */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="section" id="type" style={{ display: activeSection === 'type' ? 'block' : 'block' }}>
          <div className="section-label">01 — Typography</div>
          <h2 className="section-title">Words that carry<br /><em>weight.</em></h2>

          <div className="type-showcase">
            {typeRows.map((r, i) => (
              <div key={i} className="type-row">
                <div className="type-meta">
                  <strong>{r.meta.name}</strong>
                  {r.meta.font}<br />
                  <span style={{ marginTop: 6, display: 'block', fontStyle: 'italic' }}>{r.meta.use}</span>
                </div>
                {r.el}
                <div className="type-spec">
                  {Object.entries(r.spec).map(([k, v]) => (
                    <span key={k} style={{ display: 'block' }}>{k}: {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Font specimens */}
          <div className="font-card">
            <div className="font-specimen">
              <div className="font-name">Cormorant Garamond — Display</div>
              <div className="font-display-serif">Aa Bb<br />Cc Dd</div>
              <div className="font-weights" style={{ marginTop: 24 }}>
                {[['Light 300', 300], ['Regular 400', 400], ['Medium 500', 500], ['Bold 700', 700]].map(([l, w]) => (
                  <div key={w} className="font-w-row">
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: w, color: '#F4EFE6' }}>HORO Egypt</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#4A4A4A' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="font-specimen">
              <div className="font-name">DM Sans — Body</div>
              <div className="font-display-sans">Aa Bb<br />Cc Dd</div>
              <div className="font-weights" style={{ marginTop: 24 }}>
                {[['Light 300', 300], ['Regular 400', 400], ['Medium 500', 500], ['Semi 600', 600]].map(([l, w]) => (
                  <div key={w} className="font-w-row">
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: w, color: '#F4EFE6' }}>Wearable Art</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#4A4A4A' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="font-specimen">
              <div className="font-name">DM Mono — System</div>
              <div className="font-display-mono">649<br />EGP</div>
              <div className="font-alpha" style={{ marginTop: 24 }}>
                ABCDEFGHIJKLM<br />NOPQRSTUVWXYZ<br />0123456789
              </div>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#C4A862', letterSpacing: '0.3em' }}>USED FOR LABELS · SPECS · PRICES · DATES · CODES</span>
              </div>
            </div>
          </div>

          {/* Typographic rules */}
          <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <div style={{ padding: '36px 40px', background: 'rgba(196,168,98,0.04)', border: '1px solid rgba(196,168,98,0.15)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 20 }}>✓ Rules to Follow</div>
              <ul className="do-list">
                {['Serif for everything emotional, editorial, and human', 'Sans for everything functional, navigational, and body copy', 'Mono only for data: prices, SKUs, dates, specs, system labels', 'Never use all-caps in Cormorant — it kills the elegance', 'Italic serif is for emphasis and artist voice, used sparingly', 'Maintain a 4:1 size ratio between display and body text'].map(t => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '36px 40px', background: 'rgba(184,92,56,0.04)', border: '1px solid rgba(184,92,56,0.15)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: '#B85C38', textTransform: 'uppercase', marginBottom: 20 }}>✗ Rules to Break Never</div>
              <ul className="do-list" style={{ '--bullet-color': '#B85C38' }}>
                {['Never mix two serif typefaces', 'Never use system fonts (Arial, Helvetica, Roboto) in brand materials', 'Never center-align body text — left-align only', 'Never use bold weight of Cormorant for anything smaller than 24px', 'Never set body copy below 13px or above 16px for readability', 'Never use the brand fonts in compressed or stretched states'].map(t => (
                  <li key={t} style={{ color: '#BDBDBD' }}><span style={{ color: '#B85C38' }}>—</span> {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* COLOR                                             */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="section" id="color">
          <div className="section-label">02 — Color</div>
          <h2 className="section-title">A palette that<br /><em>remembers Egypt.</em></h2>

          <div className="palette-grid">
            {palette.map(c => (
              <div key={c.hex} className="color-swatch" onClick={() => copyHex(c.hex)}
                title={copiedColor === c.hex ? 'Copied!' : `Click to copy ${c.hex}`}>
                <div className="swatch-bar" style={{ background: c.hex, border: c.hex === '#F4EFE6' || c.hex === '#E8E0D0' || c.hex === '#BDBDBD' ? '1px solid rgba(0,0,0,0.1)' : 'none' }} />
                <div className="swatch-info">
                  <span className="swatch-name">{c.name}</span>
                  <span className="swatch-hex">{copiedColor === c.hex ? '✓ Copied' : c.hex}</span>
                  <span className="swatch-role">{c.role}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Emotional meaning */}
          <div className="color-meaning">
            {[
              { color: '#0A0A0A', name: 'Inkwell Black', meaning: 'Sophistication, depth, the gallery wall. Every premium Egyptian cotton canvas starts in darkness. Black is not emptiness — it is the space before the story begins. Use it as the dominant brand environment.' },
              { color: '#C4A862', name: 'Desert Gold', meaning: 'The color of hieroglyphs, of sunlight on limestone, of the thread that runs through Egyptian textile history. Gold is not luxury signaling — it is cultural continuity. Use it for every moment of emphasis and meaning.' },
              { color: '#F4EFE6', name: 'Parchment', meaning: 'The color of aged paper, of letters written by hand, of something kept. Against Inkwell Black, Parchment reads as warm white — softer and more human than pure white, which can feel clinical. Use it for all display text on dark.' },
              { color: '#B85C38', name: 'Ember', meaning: 'The warmth beneath the surface — the kiln, the Cairo afternoon, the first cup of tea at the workshop. Ember signals the human element: gifts, special editions, the moments that matter. Use it rarely, so it always feels significant.' },
            ].map(m => (
              <div key={m.color} className="meaning-card">
                <div className="meaning-swatch" style={{ background: m.color, border: m.color === '#F4EFE6' ? '1px solid rgba(0,0,0,0.1)' : 'none' }} />
                <div className="meaning-title">{m.name}</div>
                <div className="meaning-body">{m.meaning}</div>
              </div>
            ))}
          </div>

          {/* Color combinations */}
          <div className="color-combos" style={{ marginTop: 60 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Approved Combinations</div>
            {[
              [{ bg: '#0A0A0A', text: '#F4EFE6', accent: '#C4A862', label: 'Primary — Site & App', desc: 'Hero sections, product pages, email headers' }],
              [{ bg: '#111111', text: '#BDBDBD', accent: '#C4A862', label: 'Secondary — Cards', desc: 'Product cards, collection tiles, artist cards' },
               { bg: '#F4EFE6', text: '#0A0A0A', accent: '#C4A862', label: 'Tertiary — Light Mode', desc: 'Email body, print materials, packaging inserts' }],
              [{ bg: '#C4A862', text: '#0A0A0A', accent: '#111111', label: 'CTA — Gold on Black', desc: 'Primary buttons, badges, featured labels' },
               { bg: '#B85C38', text: '#F4EFE6', accent: '#C4A862', label: 'Accent — Ember', desc: 'Gift tags, limited edition markers, special notices' },
               { bg: '#111111', text: '#C4A862', accent: '#BDBDBD', label: 'Inverse — Gold Text', desc: 'Secondary CTAs, metadata, system text on dark' }],
            ].map((row, ri) => (
              <div key={ri} className="combo-row">
                {row.map((b, bi) => (
                  <div key={bi} className="combo-block" style={{ background: b.bg, color: b.text, flex: 1 }}>
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: b.accent, textTransform: 'uppercase', marginBottom: 6 }}>{b.label}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300 }}>HORO Egypt</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: b.text, opacity: 0.6, marginTop: 4 }}>{b.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: b.bg, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: b.text }} />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: b.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* IMAGERY                                           */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="section" id="imagery">
          <div className="section-label">03 — Imagery</div>
          <h2 className="section-title">Photos that<br /><em>prove something.</em></h2>

          <div className="imagery-grid">
            {[
              { sub: 'Product Photography', title: 'The Garment', desc: 'Flat-lay on matte black. Natural side-lighting from the left. No shadows behind — shadows beside. Always show the front, back, print macro close-up, and fabric fold in a 4-image sequence. The print detail shot is non-negotiable.', geo: true },
              { sub: 'Editorial / Lifestyle', title: 'The Person', desc: 'Cairo streets, Cairo studios, Cairo light — warm, directional, never flash. Models are real people, not catalogue faces. They should look like someone who actually lives in the city and chose this shirt deliberately.', geo: false },
              { sub: 'Artist Documentation', title: 'The Maker', desc: 'Studio footage. Hands at work. Screens showing the design in progress. The real Cairo workspace — not a generic "creative desk". The mess is part of the story. Light should be warm and slightly underexposed.', geo: true },
              { sub: 'Texture & Detail', title: 'The Material', desc: 'Macro-lens fabric shots. Show the weave structure, ink texture, print edge quality, and the weight of the cotton. These are the shots that answer "but is it actually good?" without a single word of copy.', geo: false },
            ].map((c, i) => (
              <div key={i} className="imagery-card">
                <div className="imagery-icon-area">
                  <GeoPattern size={300} color="#C4A862" opacity={1} rotate={i * 45} />
                </div>
                <div>
                  <div className="imagery-sub">{c.sub}</div>
                  <div className="imagery-title">{c.title}</div>
                  <div className="imagery-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Do / Don't */}
          <div className="do-dont" style={{ marginTop: 3 }}>
            <div className="do-card">
              <div className="do-label">✓ Do</div>
              <ul className="do-list">
                {['Dark or neutral backgrounds — never pure white for product shots', 'Warm, directional lighting (single light source from 45°)', 'Show the print at 100% crop — no artificial sharpening', 'Real Cairo context: walls, textures, streets, workshops', 'Hands holding or wearing — products are for humans', 'Consistent color grading across all product images: warm shadows, natural highlights'].map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
            <div className="dont-card">
              <div className="do-label">✗ Never</div>
              <ul className="do-list">
                {['Stock photography — ever, for any purpose in brand channels', 'White infinity backgrounds (reads as generic print shop)', 'Over-edited skin: filters, heavy presets, artificial color', 'Props that obscure the garment — the shirt is the hero', 'AI-generated people or scenes (authenticity is the brand)', 'Inconsistent aspect ratios across a single product listing'].map(t => <li key={t} style={{ color: '#BDBDBD' }}><span style={{ color: '#B85C38' }}>—</span> {t}</li>)}
              </ul>
            </div>
          </div>

          {/* Icon System */}
          <div className="icon-system">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 8 }}>Icon System</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8C8C8C', marginBottom: 32, lineHeight: 1.6 }}>
              Use only line icons with 1.5px stroke weight. Icons should be geometric and minimal — no fills, no rounded corners on geometric shapes. Color: always Mist (#8C8C8C) at rest, Gold (#C4A862) on hover or active state.
            </div>
            <div className="icon-grid">
              {iconDefs.map(ic => (
                <div key={ic.label} className="icon-tile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C4A862" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ic.path} />
                  </svg>
                  <div className="icon-tile-label">{ic.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sacred Geometry brand motif */}
          <div style={{ marginTop: 60, padding: '48px 48px', background: 'rgba(196,168,98,0.04)', border: '1px solid rgba(196,168,98,0.15)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Brand Motif — Sacred Geometry</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: '#F4EFE6', fontWeight: 300, lineHeight: 1.5, marginBottom: 20 }}>
                  The geometric pattern derived from Amira Youssef's work — a layered, symmetrical system of circles, polygons, and lines — functions as HORO's visual signature.
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8C8C8C', lineHeight: 1.7, marginBottom: 20 }}>
                  Use it as: watermark on product packaging, background texture on social posts at 6–12% opacity, corner motif on gift cards and hang tags, animated element on loading screens.
                </p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#C4A862', letterSpacing: '0.15em' }}>
                  ALWAYS GOLD OR PARCHMENT — NEVER IN COLOR
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[{ op: 0.12, label: '12% — Background' }, { op: 0.3, label: '30% — Watermark' }, { op: 0.6, label: '60% — Accent' }, { op: 1.0, label: '100% — Hero' }].map(v => (
                  <div key={v.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#0A0A0A', padding: 16, border: '1px solid rgba(196,168,98,0.15)' }}>
                      <GeoPattern size={100} color="#C4A862" opacity={v.op} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#8C8C8C', letterSpacing: '0.1em', textAlign: 'center' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* LAYOUT                                            */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="section" id="layout">
          <div className="section-label">04 — Layout</div>
          <h2 className="section-title">Structure that<br /><em>breathes.</em></h2>

          <div className="layout-grid">
            {[
              { preview: <LayoutMockHero />, name: 'Hero Editorial', use: 'Homepage · Drop Announcements', desc: 'Large display serif dominant. Geometric motif as atmospheric background at 6–10% opacity. Text left-aligned, flush to left edge. Lots of air. The product is the headline.' },
              { preview: <LayoutMockProduct />, name: 'Product Split', use: 'Product Pages · Shop Grid', desc: 'Strict 50/50 or 60/40 split. Image always left. Information hierarchy: theme tag → product name → identity statement → specs → CTA. Never center the layout.' },
              { preview: <LayoutMockArtist />, name: 'Artist Profile', use: 'Artist Pages · Drop Attribution', desc: 'Portrait-format artist avatar with generous right column for bio. Always show: location, medium, Instagram handle, edition count. Artist is a named human, never anonymous.' },
              { preview: <LayoutMockGrid />, name: 'Collection Grid', use: 'Browse Pages · Theme Navigation', desc: 'Dark card grid with theme names in display serif. Consistent aspect ratio across all cards. Gold accent on hover. No mixed heights — grid discipline is part of the premium signal.' },
            ].map((l, i) => (
              <div key={i} className="layout-card">
                <div className="layout-preview">{l.preview}</div>
                <div className="layout-use">{l.use}</div>
                <div className="layout-name">{l.name}</div>
                <div className="layout-desc">{l.desc}</div>
              </div>
            ))}
          </div>

          {/* Spacing scale */}
          <div className="spacing-scale">
            <div className="spacing-title">Spacing Scale</div>
            {[4, 8, 16, 24, 40, 60, 100, 160].map(px => (
              <div key={px} className="spacing-row">
                <div className="spacing-bar" style={{ width: px * 1.2 + 'px' }} />
                <div className="spacing-label">{px}px — {px === 4 ? 'Micro gap (icons, badges)' : px === 8 ? 'Small gap (related elements)' : px === 16 ? 'Component internal (padding)' : px === 24 ? 'Card internal (content padding)' : px === 40 ? 'Component gap (between cards)' : px === 60 ? 'Section internal (content groups)' : px === 100 ? 'Section padding (top/bottom)' : 'Major break (between chapters)'}</div>
              </div>
            ))}
          </div>

          {/* Motion tokens */}
          <div style={{ marginTop: 60 }}>
            <div className="spacing-title">Motion & Transition Tokens</div>
            <div className="token-grid">
              {[
                { name: 'Instant', value: '0ms', desc: 'State changes with no visual delay. Toggles, checkboxes.' },
                { name: 'Swift', value: '150ms', desc: 'Micro-interactions. Hover states, button feedback.' },
                { name: 'Smooth', value: '300ms', desc: 'Standard transitions. Modals, menus, expanding content.' },
                { name: 'Slow', value: '600ms', desc: 'Hero entrances, page transitions, drop reveals.' },
                { name: 'Ease In Out', value: 'cubic-bezier(.4,0,.2,1)', desc: 'Material standard. Use for most transitions.' },
                { name: 'Ease Out', value: 'cubic-bezier(0,0,.2,1)', desc: 'Elements entering screen.' },
                { name: 'Ease In', value: 'cubic-bezier(.4,0,1,1)', desc: 'Elements leaving screen.' },
                { name: 'Brand Easing', value: 'cubic-bezier(.16,1,.3,1)', desc: 'Signature HORO feel — slightly springy exit.' },
              ].map(t => (
                <div key={t.name} className="token-card">
                  <div className="token-name">{t.name}</div>
                  <div className="token-value">{t.value}</div>
                  <div className="token-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SOCIAL                                            */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="section" id="social">
          <div className="section-label">05 — Social Presence</div>
          <h2 className="section-title">Every pixel a<br /><em>chapter page.</em></h2>

          <div className="social-templates">
            {/* Instagram Square */}
            <div className="template-wrap">
              <div className="template-label">Instagram · 1:1 Feed Post</div>
              <div className="template-card">
                <div className="post-sq">
                  <div className="post-geo"><GeoPattern size={300} color="#C4A862" opacity={1} rotate={15} /></div>
                  <div className="post-logo">HORO</div>
                  <div>
                    <div className="post-tag">New Drop · Career Collection</div>
                    <div className="post-headline">The Hustler</div>
                    <div className="post-sub">649 EGP · COD Available</div>
                    <div className="post-handle">@horo.egypt</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instagram Story */}
            <div className="template-wrap">
              <div className="template-label">Instagram · 9:16 Story</div>
              <div className="template-card">
                <div className="post-story">
                  <div className="post-geo"><GeoPattern size={400} color="#C4A862" opacity={1} rotate={-10} animate /></div>
                  <div className="post-logo">HORO</div>
                  <div>
                    <div className="post-tag">Amira Youssef · Artist Edition</div>
                    <div className="post-headline" style={{ fontSize: 26 }}>Aries Fire<br />is live.</div>
                    <div className="post-sub" style={{ marginTop: 8 }}>Only 12 pieces.<br />No restocks.</div>
                    <div className="story-cta">Swipe Up →</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email header / wide */}
            <div className="template-wrap">
              <div className="template-label">Facebook / Banner · 16:9</div>
              <div className="template-card">
                <div className="post-wide">
                  <div className="post-geo"><GeoPattern size={350} color="#C4A862" opacity={1} rotate={30} /></div>
                  <div className="post-logo">HORO</div>
                  <div>
                    <div className="post-tag">Limited · Horoscope</div>
                    <div className="post-headline" style={{ fontSize: 18 }}>Artist-made wearable art.<br />Egyptian cotton. Cairo.</div>
                    <div className="post-sub">horo-fashion.vercel.app</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid rhythm */}
          <div style={{ marginTop: 60, padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(196,168,98,0.12)' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Instagram Grid Rhythm — 9 Post Cycle</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3, marginBottom: 24 }}>
              {[
                { type: 'product', label: 'P' },
                { type: 'artist', label: 'A' },
                { type: 'detail', label: 'D' },
                { type: 'product', label: 'P' },
                { type: 'story', label: 'S' },
                { type: 'product', label: 'P' },
                { type: 'behind', label: 'B' },
                { type: 'product', label: 'P' },
                { type: 'quote', label: 'Q' },
              ].map((t, i) => (
                <div key={i} style={{
                  aspectRatio: '1', background: t.type === 'product' ? '#1a1a1a' : t.type === 'artist' ? 'rgba(196,168,98,0.12)' : t.type === 'detail' ? '#141414' : t.type === 'story' ? 'rgba(184,92,56,0.12)' : t.type === 'behind' ? '#161616' : '#121212',
                  border: '1px solid rgba(196,168,98,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#C4A862', fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
              {[
                { col: '#1a1a1a', label: 'P — Product', desc: 'Clean product shot. Always shows print detail.' },
                { col: 'rgba(196,168,98,0.2)', label: 'A — Artist', desc: 'Artist portrait or studio context.' },
                { col: '#141414', label: 'D — Detail', desc: 'Macro print or fabric texture close-up.' },
                { col: 'rgba(184,92,56,0.2)', label: 'S — Story', desc: 'Buyer story, quote card, or review.' },
                { col: '#161616', label: 'B — Behind', desc: 'Workshop, process, packing — the real.' },
              ].map(k => (
                <div key={k.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 16, height: 16, background: k.col, border: '1px solid rgba(196,168,98,0.2)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#C4A862', marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8C8C8C', lineHeight: 1.5 }}>{k.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email template */}
          <div style={{ marginTop: 60 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Email Template — Drop Announcement</div>
            <div className="email-preview">
              <div className="email-header">
                <div className="email-logo">HORO</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8C8C8C', letterSpacing: '0.15em' }}>NEW DROP · ARTIST EDITION</div>
              </div>
              <div className="email-body">
                <div className="email-eyebrow">Amira Youssef × HORO — Horoscope Collection</div>
                <div className="email-headline">The fire in Aries<br />is now wearable.</div>
                <div className="email-text">Sacred geometry has always held the energy of the zodiac. Amira Youssef spent three weeks translating Aries fire into line, form, and tension. The result ships in 72 hours. 12 pieces. No restocks.</div>
                <div className="email-btn">Collect Aries Fire →</div>
                <div className="email-product-row">
                  {['Aries Fire', 'Inner Calm', 'The Hustler'].map((p, i) => (
                    <div key={p} className="email-product">
                      <div className="email-product-img">
                        <GeoPattern size={80} color="#C4A862" opacity={0.3} rotate={i * 30} />
                      </div>
                      <div className="email-product-name">{p}</div>
                      <div className="email-product-price">{i === 0 ? '849' : '649'} EGP</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="email-footer">
                <span>HORO · Cairo, Egypt · horo-fashion.vercel.app</span>
                <span>COD Available · 14-Day Exchange · Artist-Made</span>
              </div>
            </div>
          </div>

          {/* Voice & tone */}
          <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(196,168,98,0.12)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Brand Voice — How HORO Writes</div>
              {[
                { label: 'Confident, not arrogant', ex: '"This is not a print shop." — not "We\'re different from other brands."' },
                { label: 'Story-first, specs second', ex: '"Visions turned into reality" before "premium cotton Egyptian cotton."' },
                { label: 'Short sentences. Real words.', ex: '"12 pieces. No restocks." — not "Due to our limited production model..."' },
                { label: 'Arabic is always welcome', ex: 'Bilingual captions are encouraged. Arabic comes first.' },
                { label: 'The artist is always named', ex: '"Omar Tarek\'s Midnight Cairo" — never just "our Cairo piece."' },
              ].map(v => (
                <div key={v.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#F4EFE6', fontWeight: 500, marginBottom: 4 }}>{v.label}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8C8C8C', lineHeight: 1.6 }}>{v.ex}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(196,168,98,0.12)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.25em', color: '#C4A862', textTransform: 'uppercase', marginBottom: 24 }}>Caption Formula — Social Posts</div>
              {[
                { step: '01', role: 'Hook', example: '"Cairo has always had artists."' },
                { step: '02', role: 'Story', example: '"Laila Nader asked what a thought actually looks like. This is her answer."' },
                { step: '03', role: 'Product truth', example: '"Printed on 240 GSM Egyptian cotton. DTG. Washes clean."' },
                { step: '04', role: 'Scarcity', example: '"8 pieces. No restocks."' },
                { step: '05', role: 'CTA', example: '"Link in bio. COD available."' },
                { step: '06', role: 'Arabic line', example: '"الفن اللي تستحقه 🖤"' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#C4A862', flexShrink: 0, marginTop: 2 }}>{s.step}</div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F4EFE6', fontWeight: 500, marginBottom: 2 }}>{s.role}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: '#8C8C8C', fontStyle: 'italic' }}>{s.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="book-footer">
          <div>
            <div className="footer-logo">HORO</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A4A4A', letterSpacing: '0.15em', marginTop: 8 }}>Visual Identity System · Version 1.0</div>
          </div>
          <div style={{ opacity: 0.15 }}>
            <GeoPattern size={80} color="#C4A862" opacity={1} />
          </div>
          <div className="footer-meta">
            Built for HORO Egypt · 2026<br />
            Fonts: Cormorant Garamond · DM Sans · DM Mono<br />
            Derived from FACTUM 25 Research + Egypt Market Study
          </div>
        </div>

      </div>
    </>
  );
}
