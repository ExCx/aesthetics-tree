import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Calendar,
  MapPin,
  Sparkles,
  Palette,
  Layers,
  Eye,
  GitBranch,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  FileJson,
  AlertCircle,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

// ============================================================================
// 1. BUILT-IN FALLBACK DATASET (~33 Interconnected Aesthetics, 1850–2026)
// ============================================================================
const BUILTIN_DATASET = {
  stats: { nodes: 33, edges: 54 },
  nodes: [
    {
      id: 'Romanticism',
      label: 'Romanticism',
      origin_raw: 'Mid 19th Century',
      year: 1850,
      motifs: 'Ruins, dramatic landscapes, moonlit nights, poetry, emotional intensity',
      colours: 'Deep crimson, forest green, midnight blue, gold',
      platform: 'Literature, Fine Art',
      location: 'Europe',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Romanticism',
    },
    {
      id: 'Gothic',
      label: 'Gothic',
      origin_raw: 'Late 19th Century',
      year: 1860,
      motifs: 'Cathedrals, gargoyles, stained glass, candlelight, Victorian mourning',
      colours: 'Black, burgundy, charcoal, antique silver',
      platform: 'Literature, Architecture',
      location: 'Western Europe',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Gothic',
    },
    {
      id: 'Victorian',
      label: 'Victorian',
      origin_raw: 'Late 19th Century',
      year: 1875,
      motifs: 'Lace, corsets, tea sets, ornate wallpaper, pocket watches, cameos',
      colours: 'Cream, dusty rose, burgundy, emerald, mahogany',
      platform: 'Print, Fashion',
      location: 'United Kingdom',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Victorian',
    },
    {
      id: 'Art Nouveau',
      label: 'Art Nouveau',
      origin_raw: '1890s',
      year: 1895,
      motifs: 'Whiplash curves, irises, dragonflies, stained glass, botanical tendrils',
      colours: 'Sage green, ochre, peacock blue, gold',
      platform: 'Illustration, Architecture',
      location: 'Paris, Brussels, Vienna',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Art_Nouveau',
    },
    {
      id: 'Art Deco',
      label: 'Art Deco',
      origin_raw: '1920s',
      year: 1925,
      motifs: 'Sunbursts, geometric symmetry, skyscrapers, jazz age glamour, brass',
      colours: 'Gold, black, emerald, cream, navy',
      platform: 'Cinema, Architecture',
      location: 'Paris, New York',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Art_Deco',
    },
    {
      id: 'Film Noir',
      label: 'Film Noir',
      origin_raw: '1940s',
      year: 1945,
      motifs: 'Venetian blind shadows, rain-slicked streets, trench coats, neon signs',
      colours: 'Black, white, charcoal, silver',
      platform: 'Cinema',
      location: 'United States',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Film_Noir',
    },
    {
      id: 'Mid-Century Modern',
      label: 'Mid-Century Modern',
      origin_raw: '1950s',
      year: 1955,
      motifs: 'Teak furniture, starburst clocks, atomic geometry, indoor plants',
      colours: 'Mustard yellow, teal, burnt orange, walnut',
      platform: 'Design, Magazines',
      location: 'United States, Scandinavia',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Mid-Century_Modern',
    },
    {
      id: 'Psychedelia',
      label: 'Psychedelia',
      origin_raw: 'Late 1960s',
      year: 1967,
      motifs: 'Kaleidoscopes, paisley, melting typography, fractals, tie-dye',
      colours: 'Magenta, electric orange, lime green, violet',
      platform: 'Vinyl Art, Concert Posters',
      location: 'San Francisco, London',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Psychedelia',
    },
    {
      id: 'Punk',
      label: 'Punk',
      origin_raw: 'Mid 1970s',
      year: 1975,
      motifs: 'Safety pins, leather jackets, zines, tartan, studs, DIY patches',
      colours: 'Black, crimson, neon pink, white',
      platform: 'Zines, Music Venues',
      location: 'London, New York',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Punk',
    },
    {
      id: 'Goth',
      label: 'Goth',
      origin_raw: 'Early 1980s',
      year: 1980,
      motifs: 'Fishnets, silver ankhs, bats, velvet, eyeliner, post-punk vinyl',
      colours: 'Black, deep purple, crimson, silver',
      platform: 'Clubs, Zines',
      location: 'United Kingdom',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Goth',
    },
    {
      id: 'Cyberpunk',
      label: 'Cyberpunk',
      origin_raw: 'Early 1980s',
      year: 1982,
      motifs: 'Neon megacities, cybernetics, rain, holograms, CRT terminals, kanji',
      colours: 'Cyan, magenta, black, electric blue',
      platform: 'Sci-Fi Literature, Cinema, Anime',
      location: 'Global',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Cyberpunk',
    },
    {
      id: 'Steampunk',
      label: 'Steampunk',
      origin_raw: 'Late 1980s',
      year: 1987,
      motifs: 'Brass gears, goggles, airships, clockwork, steam engines, waistcoats',
      colours: 'Brass, copper, sepia, brown, burgundy',
      platform: 'Literature, Conventions',
      location: 'United Kingdom, United States',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Steampunk',
    },
    {
      id: 'Grunge',
      label: 'Grunge',
      origin_raw: 'Early 1990s',
      year: 1991,
      motifs: 'Flannel shirts, ripped denim, Doc Martens, cassette tapes, Polaroids',
      colours: 'Charcoal, forest green, burgundy, faded denim',
      platform: 'MTV, Zines, Tumblr',
      location: 'Seattle, United States',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Grunge',
    },
    {
      id: 'Dark Academia',
      label: 'Dark Academia',
      origin_raw: '1990s / Late 2010s',
      year: 1992,
      motifs: 'Tweed blazers, fountain pens, leather-bound books, libraries, busts',
      colours: 'Espresso brown, beige, forest green, burgundy, black',
      platform: 'Tumblr, TikTok, Literature',
      location: 'New England, Oxford',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Dark_Academia',
    },
    {
      id: 'Cyber Goth',
      label: 'Cyber Goth',
      origin_raw: 'Mid 1990s',
      year: 1996,
      motifs: 'UV reactive hair falls, gas masks, platform boots, biohazard symbols',
      colours: 'Neon green, black, electric blue, hot pink',
      platform: 'Industrial Clubs, Forums',
      location: 'Germany, United Kingdom',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Cyber_Goth',
    },
    {
      id: 'Y2K',
      label: 'Y2K',
      origin_raw: 'Late 1990s – Early 2000s',
      year: 1999,
      motifs: 'Translucent tech, metallic fabrics, flip phones, tribal swirls, chrome',
      colours: 'Silver, baby blue, hot pink, lime green, white',
      platform: 'MTV, Early Web, Magazines',
      location: 'Global',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Y2K',
    },
    {
      id: 'Emo',
      label: 'Emo',
      origin_raw: 'Early 2000s',
      year: 2001,
      motifs: 'Side-swept bangs, studded belts, checkered wristbands, handwritten lyrics',
      colours: 'Black, crimson, white, hot pink',
      platform: 'MySpace, PureVolume',
      location: 'United States',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Emo',
    },
    {
      id: 'Frutiger Aero',
      label: 'Frutiger Aero',
      origin_raw: 'Mid 2000s',
      year: 2005,
      motifs: 'Glossy UI orbs, water droplets, tropical fish, green hills, bokeh',
      colours: 'Sky blue, lime green, white, turquoise',
      platform: 'Windows Vista/7, Wii, Web 2.0',
      location: 'Global',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Frutiger_Aero',
    },
    {
      id: 'Indie Sleaze',
      label: 'Indie Sleaze',
      origin_raw: 'Late 2000s',
      year: 2008,
      motifs: 'Flash photography, wired headphones, American Apparel, messy eyeliner',
      colours: 'Black, gold, neon pink, silver',
      platform: 'Tumblr, MySpace, Cobra Snake',
      location: 'New York, London',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Indie_Sleaze',
    },
    {
      id: 'Synthwave',
      label: 'Synthwave',
      origin_raw: 'Late 2000s – Early 2010s',
      year: 2010,
      motifs: 'Wireframe grids, sunset horizons, sports cars, VHS scanlines, palm silhouettes',
      colours: 'Magenta, sunset orange, deep purple, cyan',
      platform: 'YouTube, SoundCloud',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Synthwave',
    },
    {
      id: 'Vaporwave',
      label: 'Vaporwave',
      origin_raw: 'Early 2010s',
      year: 2011,
      motifs: 'Roman busts, Windows 95 dialogs, malls, Arizona iced tea, palm trees',
      colours: 'Pastel pink, cyan, lavender, teal',
      platform: 'Tumblr, Bandcamp, YouTube',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Vaporwave',
    },
    {
      id: 'Pastel Goth',
      label: 'Pastel Goth',
      origin_raw: 'Early 2010s',
      year: 2012,
      motifs: 'Bat wings, pastel hair, spiked chokers, creepy-cute skulls, crosses',
      colours: 'Pastel pink, lavender, black, mint',
      platform: 'Tumblr, DeviantArt',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Pastel_Goth',
    },
    {
      id: 'Witchcore',
      label: 'Witchcore',
      origin_raw: 'Mid 2010s',
      year: 2014,
      motifs: 'Crystals, tarot cards, dried herbs, candles, moon phases, cauldrons',
      colours: 'Deep purple, black, forest green, gold',
      platform: 'Tumblr, Pinterest, TikTok',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Witchcore',
    },
    {
      id: 'Cottagecore',
      label: 'Cottagecore',
      origin_raw: 'Mid-Late 2010s',
      year: 2016,
      motifs: 'Wildflowers, sourdough bread, linen dresses, wicker baskets, meadows',
      colours: 'Sage green, cream, warm brown, butter yellow',
      platform: 'Tumblr, Pinterest, TikTok',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Cottagecore',
    },
    {
      id: 'Kidcore',
      label: 'Kidcore',
      origin_raw: 'Late 2010s',
      year: 2017,
      motifs: 'Primary color blocks, rainbow stickers, plushies, Lisa Frank, arcade carpets',
      colours: 'Red, yellow, blue, lime green, hot pink',
      platform: 'Tumblr, Instagram, TikTok',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Kidcore',
    },
    {
      id: 'Goblincore',
      label: 'Goblincore',
      origin_raw: 'Late 2010s',
      year: 2018,
      motifs: 'Mushrooms, moss, frogs, shiny trinkets, snails, muddy boots, ferns',
      colours: 'Moss green, mud brown, ochre, rust',
      platform: 'TikTok, Tumblr, Reddit',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Goblincore',
    },
    {
      id: 'Light Academia',
      label: 'Light Academia',
      origin_raw: 'Late 2010s',
      year: 2019,
      motifs: 'Linen shirts, sunlit museums, classical statues, pressed flowers, poetry',
      colours: 'Cream, beige, warm white, camel, soft gold',
      platform: 'TikTok, Pinterest, Instagram',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Light_Academia',
    },
    {
      id: 'Liminal Space',
      label: 'Liminal Space',
      origin_raw: 'Late 2010s',
      year: 2019,
      motifs: 'Empty hallways, fluorescent lights, dead malls, indoor pools, night gas stations',
      colours: 'Fluorescent yellow, muted teal, beige, grey',
      platform: 'Reddit, 4chan, YouTube, TikTok',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Liminal_Space',
    },
    {
      id: 'Dreamcore',
      label: 'Dreamcore',
      origin_raw: 'Early 2020s',
      year: 2020,
      motifs: 'Floating eyes, green hills, low-res clouds, surreal doors, angel wings',
      colours: 'Sky blue, magenta, white, pastel green',
      platform: 'TikTok, YouTube, Instagram',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Dreamcore',
    },
    {
      id: 'Weirdcore',
      label: 'Weirdcore',
      origin_raw: 'Early 2020s',
      year: 2020,
      motifs: 'Amateur 2000s web edits, compressed JPEGs, cryptic text, empty rooms',
      colours: 'Primary red, yellow, black, static grey',
      platform: 'TikTok, Tumblr, Discord',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Weirdcore',
    },
    {
      id: 'Solarpunk',
      label: 'Solarpunk',
      origin_raw: 'Early 2020s',
      year: 2021,
      motifs: 'Vertical gardens, Art Nouveau solar panels, wind turbines, communal greenhouses',
      colours: 'Emerald green, gold, sky blue, terracotta',
      platform: 'Tumblr, Reddit, Mastodon',
      location: 'Global / Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Solarpunk',
    },
    {
      id: 'Coquette',
      label: 'Coquette',
      origin_raw: 'Early 2020s',
      year: 2022,
      motifs: 'Satin ribbons, lace trim, pearls, ballet flats, vintage lockets, cherries',
      colours: 'Baby pink, cream, white, soft red',
      platform: 'TikTok, Pinterest, Tumblr',
      location: 'Internet',
      image: '',
      url: 'https://aesthetics.fandom.com/wiki/Coquette',
    },
    {
    id: 'Frutiger Eco',
    label: 'Frutiger Eco',
    origin_raw: 'Mid 2020s',
    year: 2024,
    motifs: 'Eco-futuristic cities, clean water ripples, translucent glass leaves, wind power',
    colours: 'Leaf green, aqua, white, sky blue',
    platform: 'TikTok, YouTube, Aesthetics Wiki',
    location: 'Internet',
    image: '',
    url: 'https://aesthetics.fandom.com/wiki/Frutiger_Eco',
  },
],
edges: [
  // Historical roots -> 20th century
    { source: 'Romanticism', target: 'Gothic', type: 'related' },
    { source: 'Romanticism', target: 'Art Nouveau', type: 'related' },
    { source: 'Romanticism', target: 'Cottagecore', type: 'related' },
    { source: 'Gothic', target: 'Victorian', type: 'overlap' },
    { source: 'Gothic', target: 'Goth', type: 'related' },
    { source: 'Gothic', target: 'Dark Academia', type: 'related' },
    { source: 'Victorian', target: 'Steampunk', type: 'related' },
    { source: 'Victorian', target: 'Coquette', type: 'related' },
    { source: 'Art Nouveau', target: 'Psychedelia', type: 'related' },
    { source: 'Art Nouveau', target: 'Solarpunk', type: 'related' },
    { source: 'Art Nouveau', target: 'Art Deco', type: 'related' },
    { source: 'Art Deco', target: 'Film Noir', type: 'related' },
    { source: 'Art Deco', target: 'Mid-Century Modern', type: 'related' },
    { source: 'Mid-Century Modern', target: 'Frutiger Aero', type: 'related' },
    // Punk / Goth / Grunge / Emo branch
    { source: 'Punk', target: 'Goth', type: 'subgenre' },
    { source: 'Punk', target: 'Grunge', type: 'related' },
    { source: 'Punk', target: 'Emo', type: 'related' },
    { source: 'Punk', target: 'Cyberpunk', type: 'related' },
    { source: 'Goth', target: 'Cyber Goth', type: 'subgenre' },
    { source: 'Goth', target: 'Pastel Goth', type: 'subgenre' },
    { source: 'Goth', target: 'Emo', type: 'related' },
    { source: 'Goth', target: 'Witchcore', type: 'related' },
    { source: 'Grunge', target: 'Emo', type: 'related' },
    { source: 'Grunge', target: 'Indie Sleaze', type: 'related' },
    { source: 'Emo', target: 'Pastel Goth', type: 'overlap' },
    // Cyberpunk / Digital / Retro-futurism branch
    { source: 'Cyberpunk', target: 'Steampunk', type: 'related' },
    { source: 'Cyberpunk', target: 'Cyber Goth', type: 'related' },
    { source: 'Cyberpunk', target: 'Y2K', type: 'related' },
    { source: 'Cyberpunk', target: 'Synthwave', type: 'related' },
    { source: 'Cyberpunk', target: 'Vaporwave', type: 'related' },
    { source: 'Cyberpunk', target: 'Solarpunk', type: 'related' },
    { source: 'Y2K', target: 'Frutiger Aero', type: 'related' },
    { source: 'Y2K', target: 'Vaporwave', type: 'related' },
    { source: 'Y2K', target: 'Indie Sleaze', type: 'overlap' },
    { source: 'Y2K', target: 'Kidcore', type: 'related' },
    { source: 'Frutiger Aero', target: 'Dreamcore', type: 'related' },
    { source: 'Frutiger Aero', target: 'Frutiger Eco', type: 'subgenre' },
    { source: 'Synthwave', target: 'Vaporwave', type: 'overlap' },
    { source: 'Vaporwave', target: 'Liminal Space', type: 'related' },
    { source: 'Vaporwave', target: 'Dreamcore', type: 'related' },
    // Nature / Academia / Surreal 2010s–2020s branch
    { source: 'Dark Academia', target: 'Light Academia', type: 'subgenre' },
    { source: 'Dark Academia', target: 'Witchcore', type: 'overlap' },
    { source: 'Dark Academia', target: 'Coquette', type: 'related' },
    { source: 'Witchcore', target: 'Cottagecore', type: 'overlap' },
    { source: 'Witchcore', target: 'Goblincore', type: 'related' },
    { source: 'Cottagecore', target: 'Goblincore', type: 'subgenre' },
    { source: 'Cottagecore', target: 'Light Academia', type: 'overlap' },
    { source: 'Cottagecore', target: 'Solarpunk', type: 'related' },
    { source: 'Cottagecore', target: 'Coquette', type: 'overlap' },
    { source: 'Solarpunk', target: 'Frutiger Eco', type: 'overlap' },
    { source: 'Kidcore', target: 'Dreamcore', type: 'related' },
    { source: 'Kidcore', target: 'Weirdcore', type: 'related' },
    { source: 'Liminal Space', target: 'Dreamcore', type: 'overlap' },
    { source: 'Liminal Space', target: 'Weirdcore', type: 'overlap' },
    { source: 'Dreamcore', target: 'Weirdcore', type: 'overlap' },
  ],
};

// ============================================================================
// 2. ERA DEFINITIONS & COLOR UTILITIES
// ============================================================================
const ERA_BUCKETS = [
  { id: 'Pre-1900', label: 'Pre-1900', minYear: -Infinity, maxYear: 1899, color: '#d97706' },
  { id: '1900s', label: '1900s', minYear: 1900, maxYear: 1909, color: '#eab308' },
  { id: '1910s', label: '1910s', minYear: 1910, maxYear: 1919, color: '#84cc16' },
  { id: '1920s', label: '1920s', minYear: 1920, maxYear: 1929, color: '#10b981' },
  { id: '1930s', label: '1930s', minYear: 1930, maxYear: 1939, color: '#14b8a6' },
  { id: '1940s', label: '1940s', minYear: 1940, maxYear: 1949, color: '#06b6d4' },
  { id: '1950s', label: '1950s', minYear: 1950, maxYear: 1959, color: '#0ea5e9' },
  { id: '1960s', label: '1960s', minYear: 1960, maxYear: 1969, color: '#3b82f6' },
  { id: '1970s', label: '1970s', minYear: 1970, maxYear: 1979, color: '#6366f1' },
  { id: '1980s', label: '1980s', minYear: 1980, maxYear: 1989, color: '#8b5cf6' },
  { id: '1990s', label: '1990s', minYear: 1990, maxYear: 1999, color: '#a855f7' },
  { id: '2000s', label: '2000s', minYear: 2000, maxYear: 2009, color: '#d946ef' },
  { id: '2010s', label: '2010s', minYear: 2010, maxYear: 2019, color: '#ec4899' },
  { id: '2020s', label: '2020s', minYear: 2020, maxYear: 2029, color: '#f43f5e' },
  { id: 'Undated', label: 'Undated', minYear: null, maxYear: null, color: '#64748b' },
];

const ERA_COLOR_MAP = Object.fromEntries(ERA_BUCKETS.map((b) => [b.id, b.color]));

function getEraBucketId(year) {
  if (year === null || year === undefined || Number.isNaN(Number(year))) {
    return 'Undated';
  }
  const y = Number(year);
  if (y < 1900) return 'Pre-1900';
  if (y >= 2020) return '2020s';
  const decade = Math.floor(y / 10) * 10;
  return `${decade}s`;
}

// Parse human-readable colour names or hex strings into visual swatches
const NAMED_COLORS = {
  black: '#111827',
  white: '#f8fafc',
  grey: '#6b7280',
  gray: '#6b7280',
  silver: '#cbd5e1',
  charcoal: '#334155',
  red: '#ef4444',
  crimson: '#be123c',
  burgundy: '#881337',
  maroon: '#7f1d1d',
  'soft red': '#f87171',
  pink: '#f472b6',
  'hot pink': '#ec4899',
  'pastel pink': '#fbcfe8',
  'baby pink': '#f9a8d4',
  'dusty rose': '#d8a4a8',
  magenta: '#d946ef',
  orange: '#f97316',
  'burnt orange': '#c2410c',
  'sunset orange': '#fb923c',
  rust: '#9a3412',
  terracotta: '#c26d53',
  ochre: '#ca8a04',
  yellow: '#eab308',
  'mustard yellow': '#ca8a04',
  'butter yellow': '#fef08a',
  'fluorescent yellow': '#eaff55',
  gold: '#f59e0b',
  'soft gold': '#fcd34d',
  cream: '#fef3c7',
  beige: '#e7e5e4',
  camel: '#c19a6b',
  sepia: '#785a3c',
  brown: '#78350f',
  'warm brown': '#92400e',
  'espresso brown': '#451a03',
  'mud brown': '#5c4033',
  walnut: '#5d4037',
  mahogany: '#6b211a',
  green: '#22c55e',
  'lime green': '#84cc16',
  'neon green': '#4ade80',
  'pastel green': '#bbf7d0',
  'sage green': '#84a98c',
  'forest green': '#166534',
  'moss green': '#4d7c0f',
  'leaf green': '#16a34a',
  emerald: '#10b981',
  'emerald green': '#059669',
  mint: '#6ee7b7',
  teal: '#14b8a6',
  turquoise: '#2dd4bf',
  aqua: '#22d3ee',
  cyan: '#06b6d4',
  'sky blue': '#38bdf8',
  'baby blue': '#93c5fd',
  blue: '#3b82f6',
  'electric blue': '#2563eb',
  'peacock blue': '#0369a1',
  navy: '#1e3a8a',
  'midnight blue': '#172554',
  purple: '#a855f7',
  'deep purple': '#581c87',
  violet: '#8b5cf6',
  lavender: '#c4b5fd',
  'faded denim': '#64748b',
  'warm white': '#fafaf9',
};

function parseColourSwatches(coloursStr) {
  if (!coloursStr || typeof coloursStr !== 'string') return [];
  const tokens = coloursStr
    .split(/[,;/•|\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const swatches = [];
  for (const token of tokens) {
    const clean = token.replace(/\(.*?\)/g, '').trim();
    const lower = clean.toLowerCase();
    if (!lower) continue;

    // Check explicit hex
    const hexMatch = lower.match(/#[0-9a-f]{3,6}/);
    if (hexMatch) {
      swatches.push({ label: clean, hex: hexMatch[0] });
      continue;
    }

    if (NAMED_COLORS[lower]) {
      swatches.push({ label: clean, hex: NAMED_COLORS[lower] });
      continue;
    }

    // Partial keyword fallback
  const matchedKey = Object.keys(NAMED_COLORS).find((k) => lower.includes(k));
  if (matchedKey) {
    swatches.push({ label: clean, hex: NAMED_COLORS[matchedKey] });
  }
}
return swatches.slice(0, 10);
}

// ============================================================================
// 3. DATA NORMALIZATION (Supports { nodes, edges } OR Flat Node Array)
// ============================================================================
function normalizeGraphDataset(rawJson) {
  const rawNodes = Array.isArray(rawJson)
    ? rawJson
    : Array.isArray(rawJson?.nodes)
    ? rawJson.nodes
    : [];
  const rawEdges = Array.isArray(rawJson?.edges) ? rawJson.edges : [];

  const nodeMap = new Map();
  for (const item of rawNodes) {
    if (!item) continue;
    const rawId = item.id ?? item.label ?? item.title;
    if (!rawId) continue;
    const id = String(rawId).trim();
    if (!id || nodeMap.has(id)) continue;

    let parsedYear = null;
    if (item.year !== null && item.year !== undefined && item.year !== '' && !Number.isNaN(Number(item.year))) {
      parsedYear = Number(item.year);
    } else if (typeof item.origin_raw === 'string') {
      const m = item.origin_raw.match(/(1[6-9]\d{2}|20[0-2]\d)/);
      if (m) parsedYear = Number(m[1]);
    }

    const eraId = getEraBucketId(parsedYear);
    nodeMap.set(id, {
      id,
      label: String(item.label || item.title || id),
      origin_raw: item.origin_raw || (parsedYear ? `${parsedYear}` : 'Unknown Era'),
      year: parsedYear,
      eraId,
      eraColor: ERA_COLOR_MAP[eraId] || '#64748b',
      motifs: Array.isArray(item.motifs) ? item.motifs.join(', ') : item.motifs || '',
      colours: Array.isArray(item.colours) ? item.colours.join(', ') : item.colours || '',
      platform: Array.isArray(item.platform) ? item.platform.join(', ') : item.platform || '',
      location: item.location || '',
      image: item.image || '',
      url: item.url || `https://aesthetics.fandom.com/wiki/${encodeURIComponent(id.replace(/ /g, '_'))}`,
      parents: [],
      children: [],
      peers: [],
      degree: 0,
    });
  }

  // Build unified edge list from explicit edges array OR inline node arrays
  const combinedRawEdges = [...rawEdges];
  if (rawEdges.length === 0) {
    for (const item of rawNodes) {
      const src = item?.id ?? item?.label ?? item?.title;
      if (!src) continue;
      if (Array.isArray(item.subgenres)) {
        for (const tgt of item.subgenres) combinedRawEdges.push({ source: src, target: tgt, type: 'subgenre' });
      }
      if (Array.isArray(item.related)) {
        for (const tgt of item.related) combinedRawEdges.push({ source: src, target: tgt, type: 'related' });
      }
      if (Array.isArray(item.overlaps)) {
        for (const tgt of item.overlaps) combinedRawEdges.push({ source: src, target: tgt, type: 'overlap' });
      }
    }
  }

  const directedEdges = [];
  const peerEdges = [];
  const seenDirected = new Set();
  const seenPeers = new Set();

  for (const edge of combinedRawEdges) {
    if (!edge || !edge.source || !edge.target) continue;
    const srcId = String(edge.source).trim();
    const tgtId = String(edge.target).trim();
    if (!srcId || !tgtId || srcId === tgtId) continue;

    const srcNode = nodeMap.get(srcId);
    const tgtNode = nodeMap.get(tgtId);
    if (!srcNode || !tgtNode) continue;

    const rawType = String(edge.type || 'related').toLowerCase();

    if (rawType === 'subgenre') {
      const key = `${srcId}->${tgtId}`;
      if (!seenDirected.has(key)) {
        seenDirected.add(key);
        directedEdges.push({ id: key, source: srcId, target: tgtId, kind: 'subgenre' });
        srcNode.children.push(tgtId);
        tgtNode.parents.push(srcId);
      }
    } else if (rawType === 'related') {
      const yA = srcNode.year;
      const yB = tgtNode.year;
      if (yA !== null && yB !== null && yA !== yB) {
        const older = yA < yB ? srcNode : tgtNode;
        const newer = yA < yB ? tgtNode : srcNode;
        const key = `${older.id}->${newer.id}`;
        if (!seenDirected.has(key)) {
          seenDirected.add(key);
          directedEdges.push({ id: key, source: older.id, target: newer.id, kind: 'chronological' });
          older.children.push(newer.id);
          newer.parents.push(older.id);
        }
      } else {
        const pairKey = srcId < tgtId ? `${srcId}<->${tgtId}` : `${tgtId}<->${srcId}`;
        if (!seenPeers.has(pairKey)) {
          seenPeers.add(pairKey);
          peerEdges.push({ id: pairKey, source: srcId, target: tgtId, kind: 'overlap' });
          srcNode.peers.push(tgtId);
          tgtNode.peers.push(srcId);
        }
      }
    } else {
      const pairKey = srcId < tgtId ? `${srcId}<->${tgtId}` : `${tgtId}<->${srcId}`;
      if (!seenPeers.has(pairKey)) {
        seenPeers.add(pairKey);
        peerEdges.push({ id: pairKey, source: srcId, target: tgtId, kind: 'overlap' });
        srcNode.peers.push(tgtId);
        tgtNode.peers.push(srcId);
      }
    }
  }

  for (const node of nodeMap.values()) {
    node.degree = node.parents.length + node.children.length + node.peers.length;
  }

  return {
    nodeMap,
    nodes: Array.from(nodeMap.values()),
    directedEdges,
    peerEdges,
  };
}

// ============================================================================
// 4. OFFSCREEN TEXT MEASUREMENT + PRECOMPUTED PATH2D + O(1) SPATIAL HASH GRID
// ============================================================================
const SPATIAL_CELL_SIZE = 256;

let sharedMeasureCtx = null;
function getMeasureContext() {
  if (!sharedMeasureCtx && typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    sharedMeasureCtx = c.getContext('2d');
  }
  return sharedMeasureCtx;
}

function buildCubicBezierPath(src, tgt) {
  const path = new Path2D();
  const dy = tgt.y - src.y;
  const dx = tgt.x - src.x;

  if (Math.abs(dy) < 25) {
    const arcHeight = Math.min(75, Math.max(24, Math.abs(dx) * 0.18));
    path.moveTo(src.x, src.y);
    path.bezierCurveTo(
      src.x + dx * 0.25,
      src.y - arcHeight,
      tgt.x - dx * 0.25,
      tgt.y - arcHeight,
      tgt.x,
      tgt.y
    );
    return {
      path,
      minX: Math.min(src.x, tgt.x) - 20,
      maxX: Math.max(src.x, tgt.x) + 20,
      minY: Math.min(src.y, tgt.y) - arcHeight - 10,
      maxY: Math.max(src.y, tgt.y) + 20,
    };
  }

  const cpOffset = Math.abs(dy) * 0.48;
  path.moveTo(src.x, src.y);
  path.bezierCurveTo(
    src.x,
    src.y + (dy > 0 ? cpOffset : -cpOffset),
    tgt.x,
    tgt.y - (dy > 0 ? cpOffset : -cpOffset),
    tgt.x,
    tgt.y
  );
  return {
    path,
    minX: Math.min(src.x, tgt.x) - 20,
    maxX: Math.max(src.x, tgt.x) + 20,
    minY: Math.min(src.y, tgt.y) - 20,
    maxY: Math.max(src.y, tgt.y) + 20,
  };
}

/**
 * Computes Time-Anchored Barycenter Coordinates, pre-measures text truncation,
 * precomputes native Path2D curves for all visible edges, and builds an O(1)
 * 256x256 spatial hash grid for instantaneous pointer hit-testing.
 */
function computeChronologicalLayout(visibleNodes, directedEdges, peerEdges, showUndated) {
  const activeSet = new Set(visibleNodes.map((n) => n.id));
  const buckets = new Map();
  for (const era of ERA_BUCKETS) {
    if (era.id === 'Undated' && !showUndated) continue;
    buckets.set(era.id, []);
  }

  for (const node of visibleNodes) {
    if (node.eraId === 'Undated' && !showUndated) continue;
    const list = buckets.get(node.eraId);
    if (list) list.push(node);
  }

  // Initial deterministic sort within each era: high-degree hubs near center
  for (const [, list] of buckets) {
    list.sort((a, b) => {
      const yA = a.year ?? 9999;
      const yB = b.year ?? 9999;
      if (yA !== yB) return yA - yB;
      return b.degree - a.degree || a.label.localeCompare(b.label);
    });
    const centered = [];
    list.forEach((item, idx) => {
      if (idx % 2 === 0) centered.push(item);
      else centered.unshift(item);
    });
    list.splice(0, list.length, ...centered);
  }

  // Build adjacency for active nodes only
  const neighborsMap = new Map();
  for (const n of visibleNodes) neighborsMap.set(n.id, []);
  for (const e of directedEdges) {
    if (activeSet.has(e.source) && activeSet.has(e.target)) {
      neighborsMap.get(e.source).push(e.target);
      neighborsMap.get(e.target).push(e.source);
    }
  }
  for (const e of peerEdges) {
    if (activeSet.has(e.source) && activeSet.has(e.target)) {
      neighborsMap.get(e.source).push(e.target);
      neighborsMap.get(e.target).push(e.source);
    }
  }

  // Assign normalized initial X rank in [-1, 1]
  const normX = new Map();
  for (const [, list] of buckets) {
    const len = list.length;
    list.forEach((node, idx) => {
      normX.set(node.id, len <= 1 ? 0 : (idx / (len - 1)) * 2 - 1);
    });
  }

  // 3 iterations of Barycenter horizontal sorting
  const eraKeys = Array.from(buckets.keys());
  for (let iter = 0; iter < 3; iter++) {
    const order = iter % 2 === 0 ? eraKeys : [...eraKeys].reverse();
    for (const eraId of order) {
      const list = buckets.get(eraId);
      if (!list || list.length <= 1) continue;

      const barycenters = new Map();
      for (const node of list) {
        const nbrs = neighborsMap.get(node.id) || [];
        if (nbrs.length === 0) {
          barycenters.set(node.id, normX.get(node.id) ?? 0);
        } else {
          let sum = 0;
          for (const nbrId of nbrs) {
            sum += normX.get(nbrId) ?? 0;
          }
          barycenters.set(node.id, 0.8 * (sum / nbrs.length) + 0.2 * (normX.get(node.id) ?? 0));
        }
      }

      list.sort((a, b) => (barycenters.get(a.id) ?? 0) - (barycenters.get(b.id) ?? 0));
      const len = list.length;
      list.forEach((node, idx) => {
        normX.set(node.id, len <= 1 ? 0 : (idx / (len - 1)) * 2 - 1);
      });
    }
  }

  const NODE_W = 156;
  const NODE_H = 36;
  const H_GAP = 26;
  const SUBROW_H = 54;
  const ERA_PADDING_Y = 36;
  const MAX_COLS_PER_SUBROW = 34;

  const mCtx = getMeasureContext();
  const positionedNodes = [];
  const positionedMap = new Map();
  const spatialGrid = new Map();
  const swimlanes = [];

  let currentY = 80;
  let minX = -600;
  let maxX = 600;

  for (const era of ERA_BUCKETS) {
    if (!buckets.has(era.id)) continue;
    const list = buckets.get(era.id);
    const count = list.length;

    const numSubRows = Math.max(1, Math.ceil(count / MAX_COLS_PER_SUBROW));
    const bandHeight = Math.max(116, numSubRows * SUBROW_H + ERA_PADDING_Y * 2);
    const bandTop = currentY;
    const bandBottom = currentY + bandHeight;

    swimlanes.push({
      id: era.id,
      label: era.label,
      color: era.color,
      count,
      top: bandTop,
      bottom: bandBottom,
      height: bandHeight,
    });

    if (count > 0) {
      for (let idx = 0; idx < count; idx++) {
        const node = list[idx];
        const subRow = idx % numSubRows;
        const col = Math.floor(idx / numSubRows);
        const colsInThisSubRow = Math.ceil((count - subRow) / numSubRows);

        const rowWidth = (colsInThisSubRow - 1) * (NODE_W + H_GAP);
        const x = -rowWidth / 2 + col * (NODE_W + H_GAP);

        let intraOffset = 0;
        if (node.year !== null && era.minYear !== null && era.maxYear !== null && era.id !== 'Pre-1900') {
          const frac = Math.max(0, Math.min(1, (node.year - era.minYear) / 9));
          intraOffset = (frac - 0.5) * 14;
        }

        const totalSubHeight = (numSubRows - 1) * SUBROW_H;
        const y = bandTop + bandHeight / 2 - totalSubHeight / 2 + subRow * SUBROW_H + intraOffset;

        // Precompute badge & truncated label once (never in render loop)
        const degText = String(node.degree);
        let badgeW = 22;
        let truncatedLabel = node.label;
        let labelWidth = node.label.length * 6.8;

        if (mCtx) {
          mCtx.font = '600 10px Inter, system-ui, sans-serif';
          badgeW = Math.max(20, mCtx.measureText(degText).width + 10);
          const textMaxW = NODE_W - badgeW - 38;
          mCtx.font = '600 12px Inter, system-ui, sans-serif';
          labelWidth = mCtx.measureText(truncatedLabel).width;
          if (labelWidth > textMaxW) {
            while (truncatedLabel.length > 3 && mCtx.measureText(`${truncatedLabel}…`).width > textMaxW) {
              truncatedLabel = truncatedLabel.slice(0, -1);
            }
            truncatedLabel = `${truncatedLabel}…`;
            labelWidth = mCtx.measureText(truncatedLabel).width;
          }
        }

        const dotRadius = Math.min(11, 4.5 + Math.sqrt(node.degree) * 1.1);
        const pNode = {
          ...node,
          x,
          y,
          width: NODE_W,
          height: NODE_H,
          dotRadius,
          degText,
          badgeW,
          truncatedLabel,
          labelWidth,
        };

        positionedNodes.push(pNode);
        positionedMap.set(pNode.id, pNode);

        // Insert into 256x256 spatial hash grid buckets
        const halfW = NODE_W / 2 + 12;
        const halfH = NODE_H / 2 + 12;
        const gx0 = Math.floor((x - halfW) / SPATIAL_CELL_SIZE);
        const gx1 = Math.floor((x + halfW) / SPATIAL_CELL_SIZE);
        const gy0 = Math.floor((y - halfH) / SPATIAL_CELL_SIZE);
        const gy1 = Math.floor((y + halfH) / SPATIAL_CELL_SIZE);
        for (let gx = gx0; gx <= gx1; gx++) {
          for (let gy = gy0; gy <= gy1; gy++) {
            const cellKey = `${gx},${gy}`;
            let cell = spatialGrid.get(cellKey);
            if (!cell) {
              cell = [];
              spatialGrid.set(cellKey, cell);
            }
            cell.push(pNode);
          }
        }

        minX = Math.min(minX, x - NODE_W);
        maxX = Math.max(maxX, x + NODE_W);
      }
    }

    currentY = bandBottom;
  }

  // Precompute Path2D + bounding boxes for all visible directed & peer edges
  const layoutDirectedEdges = [];
  for (const edge of directedEdges) {
    const src = positionedMap.get(edge.source);
    const tgt = positionedMap.get(edge.target);
    if (!src || !tgt) continue;
    const geom = buildCubicBezierPath(src, tgt);
    layoutDirectedEdges.push({
      ...edge,
      ...geom,
    });
  }

  const layoutPeerEdges = [];
  for (const edge of peerEdges) {
    const src = positionedMap.get(edge.source);
    const tgt = positionedMap.get(edge.target);
    if (!src || !tgt) continue;
    const geom = buildCubicBezierPath(src, tgt);
    layoutPeerEdges.push({
      ...edge,
      ...geom,
    });
  }

  return {
    positionedNodes,
    positionedMap,
    spatialGrid,
    layoutDirectedEdges,
    layoutPeerEdges,
    swimlanes,
    bounds: {
      minX: minX - 180,
      maxX: maxX + 180,
      minY: 40,
      maxY: currentY + 80,
    },
  };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// ============================================================================
// 5. MAIN COMPONENT (Zero-Lag Imperative Canvas + Lightweight React UI)
// ============================================================================
export default function App() {
  // Low-frequency UI State ONLY
  const [rawDataset, setRawDataset] = useState(BUILTIN_DATASET);
  const [datasetSourceName, setDatasetSourceName] = useState('Built-in Sample (1850–2026)');
  const [isCustomDataset, setIsCustomDataset] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [selectedId, setSelectedId] = useState('Cyberpunk');
  const [focusLineageOnly, setFocusLineageOnly] = useState(false);
  const [hideIsolated, setHideIsolated] = useState(false);
  const [showUndated, setShowUndated] = useState(false);
  const [showSubgenres, setShowSubgenres] = useState(true);
  const [showChronological, setShowChronological] = useState(true);
  const [showOverlaps, setShowOverlaps] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [selectedId]);

  // Imperative Refs for Locked-60fps Rendering (Zero React re-renders on pan/zoom/hover)
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const zoomTextRef = useRef(null);

  const cameraRef = useRef({
    x: 0,
    y: 0,
    scale: 0.85,
    targetX: 0,
    targetY: 0,
    targetScale: 0.85,
  });
  const dirtyRef = useRef(true);
  const hoveredIdRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origCamX: 0,
    origCamY: 0,
    pinchDist: 0,
    origCamScale: 1,
  });

  const triggerToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadJsonPayload = useCallback(
    (data, sourceLabel) => {
      const hasNodesArray = Array.isArray(data) || Array.isArray(data?.nodes);
      if (!data || !hasNodesArray) {
        triggerToast('Invalid JSON format: expected { "nodes": [...], "edges": [...] } or [...]', 'error');
        return;
      }
      setRawDataset(data);
      setDatasetSourceName(sourceLabel);
      setIsCustomDataset(true);
      setFocusLineageOnly(false);

      const norm = normalizeGraphDataset(data);
      setHideIsolated(norm.nodes.length > 100);

      const sortedByDegree = [...norm.nodes].sort((a, b) => b.degree - a.degree);
      const topNode = sortedByDegree[0] || norm.nodes[0];
      setSelectedId(topNode ? topNode.id : null);
      dirtyRef.current = true;

      triggerToast(
        `Loaded ${norm.nodes.length.toLocaleString()} aesthetics & ${(
          norm.directedEdges.length + norm.peerEdges.length
        ).toLocaleString()} connections`,
        'success'
      );
    },
    [triggerToast]
  );

  // Silent autoload if aesthetics_data.json is served alongside the app
  useEffect(() => {
    let cancelled = false;
    fetch('./aesthetics_data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && (Array.isArray(data) || Array.isArray(data.nodes))) {
          loadJsonPayload(data, 'aesthetics_data.json');
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loadJsonPayload]);

  const handleFileObject = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          loadJsonPayload(parsed, file.name);
        } catch (err) {
          triggerToast(`Could not parse JSON: ${err.message}`, 'error');
        }
      };
      reader.readAsText(file);
    },
    [loadJsonPayload, triggerToast]
  );

  useEffect(() => {
    const onDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingFile(true);
      }
    };
    const onDragLeave = (e) => {
      if (e.relatedTarget === null) {
        setIsDraggingFile(false);
      }
    };
    const onDrop = (e) => {
      e.preventDefault();
      setIsDraggingFile(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileObject(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleFileObject]);

  // Keyboard shortcuts ('/' to search, 'Escape' to clear)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (searchFocused) {
          setSearchFocused(false);
          searchInputRef.current?.blur();
        } else {
          setSelectedId(null);
          setFocusLineageOnly(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchFocused]);

  // Normalize full graph
  const graph = useMemo(() => normalizeGraphDataset(rawDataset), [rawDataset]);

  // Compute full upstream ancestry, downstream descendants, and lateral peers for selectedId
  const lineage = useMemo(() => {
    const ancestorNodes = new Set();
    const descendantNodes = new Set();
    const peerNodes = new Set();
    const ancestorEdges = new Set();
    const descendantEdges = new Set();
    const peerEdgesSet = new Set();

    if (!selectedId || !graph.nodeMap.has(selectedId)) {
      return {
        ancestorNodes,
        descendantNodes,
        peerNodes,
        ancestorEdges,
        descendantEdges,
        peerEdgesSet,
        allFamilyNodes: new Set(),
      };
    }

    const upQueue = [selectedId];
    const upVisited = new Set([selectedId]);
    while (upQueue.length > 0) {
      const currId = upQueue.shift();
      const currNode = graph.nodeMap.get(currId);
      if (!currNode) continue;
      for (const pId of currNode.parents) {
        ancestorEdges.add(`${pId}->${currId}`);
        if (!upVisited.has(pId)) {
          upVisited.add(pId);
          ancestorNodes.add(pId);
          upQueue.push(pId);
        }
      }
    }

    const downQueue = [selectedId];
    const downVisited = new Set([selectedId]);
    while (downQueue.length > 0) {
      const currId = downQueue.shift();
      const currNode = graph.nodeMap.get(currId);
      if (!currNode) continue;
      for (const cId of currNode.children) {
        descendantEdges.add(`${currId}->${cId}`);
        if (!downVisited.has(cId)) {
          downVisited.add(cId);
          descendantNodes.add(cId);
          downQueue.push(cId);
        }
      }
    }

    const selNode = graph.nodeMap.get(selectedId);
    if (selNode) {
      for (const peerId of selNode.peers) {
        peerNodes.add(peerId);
        const pairKey = selectedId < peerId ? `${selectedId}<->${peerId}` : `${peerId}<->${selectedId}`;
        peerEdgesSet.add(pairKey);
      }
    }

    const allFamilyNodes = new Set([
      selectedId,
      ...ancestorNodes,
      ...descendantNodes,
      ...peerNodes,
    ]);

    return {
      ancestorNodes,
      descendantNodes,
      peerNodes,
      ancestorEdges,
      descendantEdges,
      peerEdgesSet,
      allFamilyNodes,
    };
  }, [selectedId, graph]);

  // Filter nodes before layout
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      if (!showUndated && node.eraId === 'Undated') return false;
      if (focusLineageOnly && selectedId && lineage.allFamilyNodes.size > 0) {
        return lineage.allFamilyNodes.has(node.id);
      }
      if (hideIsolated && node.degree === 0 && node.id !== selectedId) {
        return false;
      }
      return true;
    });
  }, [graph.nodes, showUndated, focusLineageOnly, selectedId, lineage.allFamilyNodes, hideIsolated]);

  // Precomputed Layout + Path2D + Spatial Hash Grid
  const layout = useMemo(() => {
    return computeChronologicalLayout(
      filteredNodes,
      graph.directedEdges,
      graph.peerEdges,
      showUndated
    );
  }, [filteredNodes, graph.directedEdges, graph.peerEdges, showUndated]);

  // Fit view to bounds
  const fitToScreen = useCallback(
    (animate = true) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const drawerOffset = selectedId && rect.width > 768 ? 380 : 0;
      const availW = Math.max(200, rect.width - drawerOffset);
      const availH = Math.max(200, rect.height - 56);

      const { minX, maxX, minY, maxY } = layout.bounds;
      const graphW = Math.max(400, maxX - minX);
      const graphH = Math.max(400, maxY - minY);

      const scaleX = availW / graphW;
      const scaleY = availH / graphH;
      const targetScale = Math.max(0.14, Math.min(1.05, Math.min(scaleX, scaleY) * 0.92));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const targetX = availW / 2 - centerX * targetScale;
      const targetY = 56 + availH / 2 - centerY * targetScale;

      if (animate) {
        cameraRef.current.targetX = targetX;
        cameraRef.current.targetY = targetY;
        cameraRef.current.targetScale = targetScale;
      } else {
        cameraRef.current = {
          x: targetX,
          y: targetY,
          scale: targetScale,
          targetX,
          targetY,
          targetScale,
        };
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(targetScale * 100)}%`;
        }
      }
      dirtyRef.current = true;
    },
    [layout.bounds, selectedId]
  );

  // Smooth pan-to-node
  const focusNode = useCallback(
    (nodeId, autoSelect = true) => {
      const targetNode = layout.positionedMap.get(nodeId);
      if (autoSelect) setSelectedId(nodeId);
      if (!targetNode || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const drawerOffset = rect.width > 768 ? 380 : 0;
      const availW = Math.max(200, rect.width - drawerOffset);
      const availH = Math.max(200, rect.height - 56);

      const targetScale = Math.max(0.95, Math.min(1.35, cameraRef.current.targetScale));
      cameraRef.current.targetScale = targetScale;
      cameraRef.current.targetX = availW / 2 - targetNode.x * targetScale;
      cameraRef.current.targetY = 56 + availH / 2 - targetNode.y * targetScale;
      dirtyRef.current = true;
    },
    [layout.positionedMap]
  );

  useEffect(() => {
    fitToScreen(false);
  }, [rawDataset, focusLineageOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Instant search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches = [];
    for (const node of graph.nodes) {
      const inLabel = node.label.toLowerCase().includes(q);
      const inMotifs = node.motifs.toLowerCase().includes(q);
      const inPlatform = node.platform.toLowerCase().includes(q);
      const inOrigin = node.origin_raw.toLowerCase().includes(q);
      if (inLabel || inMotifs || inPlatform || inOrigin) {
        matches.push({
          node,
          score: inLabel ? (node.label.toLowerCase().startsWith(q) ? 3 : 2) : 1,
        });
      }
    }
    matches.sort((a, b) => b.score - a.score || b.node.degree - a.node.degree);
    return matches.slice(0, 12).map((m) => m.node);
  }, [searchQuery, graph.nodes]);

  // Keep latest render parameters in a ref so the RAF loop never restarts unnecessarily
  const sceneRef = useRef({
    layout,
    selectedId,
    lineage,
    showSubgenres,
    showChronological,
    showOverlaps,
  });
  useEffect(() => {
    sceneRef.current = {
      layout,
      selectedId,
      lineage,
      showSubgenres,
      showChronological,
      showOverlaps,
    };
    dirtyRef.current = true;
  }, [layout, selectedId, lineage, showSubgenres, showChronological, showOverlaps]);

  // ============================================================================
  // 6. LOCKED-60FPS DIRTY-FLAGGED CANVAS RENDER LOOP (BATCHED PATH2D)
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let width = 0;
    let height = 0;
    let rafId = null;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirtyRef.current = true;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const renderScene = () => {
      const cam = cameraRef.current;
      const k = cam.scale;
      const camX = cam.x;
      const camY = cam.y;

      const {
        layout: currentLayout,
        selectedId: activeSelectedId,
        lineage: activeLineage,
        showSubgenres: subOn,
        showChronological: chronoOn,
        showOverlaps: overlapOn,
      } = sceneRef.current;

      const hoveredId = hoveredIdRef.current;
      const hoveredNode = hoveredId ? currentLayout.positionedMap.get(hoveredId) : null;

      // Solid opaque clear ({ alpha: false })
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const worldLeft = -camX / k;
      const worldRight = (width - camX) / k;
      const worldTop = -camY / k;
      const worldBottom = (height - camY) / k;

      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(k, k);

      // 1) Era Swimlanes (frustum culled)
      for (let i = 0; i < currentLayout.swimlanes.length; i++) {
        const lane = currentLayout.swimlanes[i];
        if (lane.bottom < worldTop - 100 || lane.top > worldBottom + 100) continue;

        ctx.fillStyle = i % 2 === 0 ? '#0d1322' : '#090d16';
        ctx.fillRect(worldLeft - 400, lane.top, worldRight - worldLeft + 800, lane.height);

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 1 / k;
        ctx.beginPath();
        ctx.moveTo(worldLeft - 400, lane.top);
        ctx.lineTo(worldRight + 400, lane.top);
        ctx.stroke();
      }

      const hasSelection = Boolean(activeSelectedId && currentLayout.positionedMap.has(activeSelectedId));

      // Compute ambient hairline fade at far zoom (scale < 0.35) when nothing is selected/hovered
      let ambientAlpha = hasSelection ? 0.06 : k < 0.42 ? 0.24 : 0.42;
      if (!hasSelection && !hoveredNode && k < 0.35) {
        ambientAlpha = Math.max(0, ((k - 0.22) / 0.13) * 0.24);
      }

      // 2) Batched Path2D Edge Buckets (1 stroke() call per style bucket)
      const ambientSubgenreBatch = ambientAlpha > 0.01 && subOn ? new Path2D() : null;
      const ambientChronoBatch = ambientAlpha > 0.01 && chronoOn ? new Path2D() : null;
      const ambientPeerBatch = ambientAlpha > 0.01 && overlapOn ? new Path2D() : null;

      const ancestorBatch = hasSelection ? new Path2D() : null;
      const descendantBatch = hasSelection ? new Path2D() : null;
      const activePeerBatch = hasSelection ? new Path2D() : null;
      const hoverPreviewBatch = !hasSelection && hoveredNode ? new Path2D() : null;

      // Collect directed edges into batches
      for (let i = 0; i < currentLayout.layoutDirectedEdges.length; i++) {
        const edge = currentLayout.layoutDirectedEdges[i];
        if (edge.kind === 'subgenre' && !subOn) continue;
        if (edge.kind === 'chronological' && !chronoOn) continue;

        // Frustum cull
        if (
          edge.maxX < worldLeft ||
          edge.minX > worldRight ||
          edge.maxY < worldTop ||
          edge.minY > worldBottom
        ) {
          continue;
        }

        if (hasSelection) {
          if (activeLineage.ancestorEdges.has(edge.id)) {
            ancestorBatch.addPath(edge.path);
            continue;
          }
          if (activeLineage.descendantEdges.has(edge.id)) {
            descendantBatch.addPath(edge.path);
            continue;
          }
        } else if (hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id)) {
          hoverPreviewBatch.addPath(edge.path);
          continue;
        }

        if (edge.kind === 'subgenre' && ambientSubgenreBatch) {
          ambientSubgenreBatch.addPath(edge.path);
        } else if (edge.kind === 'chronological' && ambientChronoBatch) {
          ambientChronoBatch.addPath(edge.path);
        }
      }

      // Collect peer/lateral edges into batches
      for (let i = 0; i < currentLayout.layoutPeerEdges.length; i++) {
        const edge = currentLayout.layoutPeerEdges[i];
        if (
          edge.maxX < worldLeft ||
          edge.minX > worldRight ||
          edge.maxY < worldTop ||
          edge.minY > worldBottom
        ) {
          continue;
        }

        if (hasSelection && activeLineage.peerEdgesSet.has(edge.id)) {
          activePeerBatch.addPath(edge.path);
          continue;
        }
        if (!hasSelection && hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id)) {
          hoverPreviewBatch.addPath(edge.path);
          continue;
        }
        if (ambientPeerBatch) {
          ambientPeerBatch.addPath(edge.path);
        }
      }

      const baseStrokeW = Math.max(0.8, 1.25 / Math.sqrt(k));
      const activeStrokeW = Math.max(2.1, 2.7 / Math.sqrt(k));

      if (ambientChronoBatch) {
        ctx.globalAlpha = ambientAlpha;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = baseStrokeW;
        ctx.stroke(ambientChronoBatch);
      }

      if (ambientSubgenreBatch) {
        ctx.globalAlpha = ambientAlpha;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = baseStrokeW;
        ctx.stroke(ambientSubgenreBatch);
      }

      if (ambientPeerBatch) {
        ctx.globalAlpha = hasSelection ? 0.05 : ambientAlpha * 0.85;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = baseStrokeW;
        ctx.setLineDash([5, 5]);
        ctx.stroke(ambientPeerBatch);
        ctx.setLineDash([]);
      }

      if (hoverPreviewBatch) {
        ctx.globalAlpha = 0.88;
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = activeStrokeW;
        ctx.stroke(hoverPreviewBatch);
      }

      if (activePeerBatch) {
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = activeStrokeW;
        ctx.setLineDash([6, 5]);
        ctx.stroke(activePeerBatch);
        ctx.setLineDash([]);
      }

      if (ancestorBatch) {
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = activeStrokeW;
        ctx.stroke(ancestorBatch);
      }

      if (descendantBatch) {
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = activeStrokeW;
        ctx.stroke(descendantBatch);
      }

      // 3) Render Nodes (LOD Semantic Zoom at scale = 0.42, zero shadowBlur, zero measureText)
      const isZoomedOut = k < 0.42;
      const deferredLabels = [];

      for (let i = 0; i < currentLayout.positionedNodes.length; i++) {
        const node = currentLayout.positionedNodes[i];
        if (
          node.x + node.width < worldLeft ||
          node.x - node.width > worldRight ||
          node.y + node.height < worldTop ||
          node.y - node.height > worldBottom
        ) {
          continue;
        }

        const isSelected = node.id === activeSelectedId;
        const isHovered = node.id === hoveredId;
        const isAncestor = hasSelection && activeLineage.ancestorNodes.has(node.id);
        const isDescendant = hasSelection && activeLineage.descendantNodes.has(node.id);
        const isPeer = hasSelection && activeLineage.peerNodes.has(node.id);
        const isInFamily = isSelected || isAncestor || isDescendant || isPeer;
        const isDimmed = hasSelection && !isInFamily && !isHovered;

        let accentColor = node.eraColor;
        if (isSelected) accentColor = '#f472b6';
        else if (isAncestor) accentColor = '#f59e0b';
        else if (isDescendant) accentColor = '#06b6d4';
        else if (isPeer) accentColor = '#a855f7';

        ctx.globalAlpha = isDimmed ? 0.16 : 1;

        if (isZoomedOut) {
          const baseRadius = node.dotRadius;
          const radius = isSelected ? baseRadius + 4 : isInFamily || isHovered ? baseRadius + 2 : baseRadius;

          // Lightweight concentric halo instead of expensive shadowBlur
          if (isSelected || isHovered || isInFamily || node.degree >= 5) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = isDimmed ? 0.04 : isSelected ? 0.32 : 0.16;
            ctx.fill();
            ctx.globalAlpha = isDimmed ? 0.16 : 1;
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#ffffff' : accentColor;
          ctx.fill();

          if (isSelected || isHovered || isInFamily) {
            ctx.lineWidth = 2.2 / k;
            ctx.strokeStyle = isSelected ? '#f472b6' : '#ffffff';
            ctx.stroke();
          }

          if (isSelected || isHovered || isInFamily || node.degree >= 6) {
            deferredLabels.push({
              node,
              radius,
              isSelected,
              isHovered,
              isInFamily,
            });
          }
        } else {
          const w = node.width;
          const h = node.height;
          const left = node.x - w / 2;
          const top = node.y - h / 2;
          const r = h / 2;

          // Lightweight concentric outer halo for active/hovered pill
          if (isSelected || isHovered) {
            drawRoundedRect(ctx, left - 4, top - 4, w + 8, h + 8, r + 4);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = isSelected ? 0.24 : 0.16;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          drawRoundedRect(ctx, left, top, w, h, r);
          ctx.fillStyle = isSelected ? '#1e1b4b' : isInFamily ? '#111b2e' : '#0f172a';
          ctx.fill();

          ctx.lineWidth = isSelected ? 2.4 : isInFamily || isHovered ? 1.9 : 1.1;
          ctx.strokeStyle = isSelected || isInFamily || isHovered ? accentColor : '#263349';
          ctx.stroke();

          // Left era dot
          ctx.beginPath();
          ctx.arc(left + 14, node.y, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();

          // Pre-measured degree badge on right
          const badgeW = node.badgeW;
          const badgeH = 18;
          const badgeX = left + w - badgeW - 8;
          const badgeY = node.y - badgeH / 2;

          drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 9);
          ctx.fillStyle = isInFamily ? 'rgba(255,255,255,0.1)' : 'rgba(30, 41, 59, 0.85)';
          ctx.fill();

          ctx.font = '600 10px Inter, system-ui, sans-serif';
          ctx.fillStyle = isInFamily ? '#f8fafc' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.degText, badgeX + badgeW / 2, node.y + 0.5);

          // Pre-truncated title label
          ctx.font = `${isSelected || isInFamily ? '700' : '500'} 12px Inter, system-ui, sans-serif`;
          ctx.fillStyle = isSelected ? '#ffffff' : isInFamily ? '#f8fafc' : '#e2e8f0';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.truncatedLabel, left + 24, node.y + 0.5);
        }
      }

      // Collision-avoiding hub labels when zoomed out
      if (isZoomedOut && deferredLabels.length > 0) {
        ctx.globalAlpha = 1;
        deferredLabels.sort(
          (a, b) =>
            (b.isSelected || b.isHovered ? 100 : b.isInFamily ? 50 : b.node.degree) -
            (a.isSelected || a.isHovered ? 100 : a.isInFamily ? 50 : a.node.degree)
        );
        const placedBoxes = [];
        const fontSize = Math.max(11, Math.min(14, 11.5 / k));
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        for (let i = 0; i < deferredLabels.length; i++) {
          const item = deferredLabels[i];
          const textW = (item.node.labelWidth || 70) * (fontSize / 12) + 12 / k;
          const textH = fontSize + 4 / k;
          const lx = item.node.x;
          const ly = item.node.y - item.radius - 4 / k;
          const box = {
            left: lx - textW / 2,
            right: lx + textW / 2,
            top: ly - textH,
            bottom: ly,
          };

          const collides =
            !item.isSelected &&
            !item.isHovered &&
            placedBoxes.some(
              (b) =>
                box.left < b.right &&
                box.right > b.left &&
                box.top < b.bottom &&
                box.bottom > b.top
            );
          if (collides) continue;
          placedBoxes.push(box);

          ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
          ctx.fillRect(box.left, box.top, textW, textH);
          ctx.fillStyle =
            item.isSelected || item.isHovered ? '#ffffff' : item.isInFamily ? '#f8fafc' : '#cbd5e1';
          ctx.fillText(item.node.label, lx, ly - 1 / k);
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // 4) Sticky Left-Edge Decade Badges in Screen Space
      for (let i = 0; i < currentLayout.swimlanes.length; i++) {
        const lane = currentLayout.swimlanes[i];
        const screenTop = lane.top * k + camY;
        const screenBottom = lane.bottom * k + camY;
        if (screenBottom < 56 || screenTop > height) continue;

        const badgeY = Math.max(66, Math.min(screenBottom - 26, screenTop + 10));
        drawRoundedRect(ctx, 14, badgeY, 96, 22, 6);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(24, badgeY + 11, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = lane.color;
        ctx.fill();

        ctx.font = '700 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(lane.label, 33, badgeY + 11.5);

        ctx.font = '500 10px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText(String(lane.count), 103, badgeY + 11.5);
      }
    };

    // Main RAF ticker: interpolates camera smoothly and renders ONLY when dirty
    const tick = () => {
      const cam = cameraRef.current;
      const dx = cam.targetX - cam.x;
      const dy = cam.targetY - cam.y;
      const ds = cam.targetScale - cam.scale;

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(ds) > 0.0004) {
        cam.x += dx * 0.24;
        cam.y += dy * 0.24;
        cam.scale += ds * 0.24;
        dirtyRef.current = true;
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(cam.scale * 100)}%`;
        }
      } else if (dx !== 0 || dy !== 0 || ds !== 0) {
        cam.x = cam.targetX;
        cam.y = cam.targetY;
        cam.scale = cam.targetScale;
        dirtyRef.current = true;
        if (zoomTextRef.current) {
          zoomTextRef.current.textContent = `${Math.round(cam.scale * 100)}%`;
        }
      }

      if (dirtyRef.current) {
        dirtyRef.current = false;
        renderScene();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ============================================================================
  // 7. O(1) SPATIAL HASH HIT-TESTING & IMPERATIVE POINTER HANDLERS
  // ============================================================================
  const findNodeAtScreenPos = useCallback(
    (clientX, clientY) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;

      const { x: camX, y: camY, scale: k } = cameraRef.current;
      const wx = (sx - camX) / k;
      const wy = (sy - camY) / k;
      const isZoomedOut = k < 0.42;

      // Query only the 1 spatial grid bucket under the cursor (O(1))
      const gx = Math.floor(wx / SPATIAL_CELL_SIZE);
      const gy = Math.floor(wy / SPATIAL_CELL_SIZE);
      const bucket = layout.spatialGrid.get(`${gx},${gy}`);
      if (!bucket || bucket.length === 0) return null;

      let fallbackHit = null;
      for (let i = bucket.length - 1; i >= 0; i--) {
        const node = bucket[i];
        let isHit = false;

        if (isZoomedOut) {
          const hitR = Math.max(12 / k, node.dotRadius + 4);
          const dx = wx - node.x;
          const dy = wy - node.y;
          isHit = dx * dx + dy * dy <= hitR * hitR;
        } else {
          const halfW = node.width / 2 + 3;
          const halfH = node.height / 2 + 3;
          isHit =
            wx >= node.x - halfW &&
            wx <= node.x + halfW &&
            wy >= node.y - halfH &&
            wy <= node.y + halfH;
        }

        if (isHit) {
          const isImportant =
            node.id === selectedId ||
            lineage.ancestorNodes.has(node.id) ||
            lineage.descendantNodes.has(node.id) ||
            lineage.peerNodes.has(node.id);
          if (isImportant) return node;
          if (!fallbackHit) fallbackHit = node;
        }
      }

      return fallbackHit;
    },
    [layout.spatialGrid, selectedId, lineage]
  );

  // Imperatively show/hide floating hover tooltip without triggering React state
  const updateHoverTooltip = useCallback((node, clientX, clientY) => {
    const tip = tooltipRef.current;
    const canvas = canvasRef.current;
    if (!tip) return;

    if (!node) {
      tip.style.opacity = '0';
      tip.style.pointerEvents = 'none';
      if (canvas) canvas.style.cursor = dragStateRef.current.active ? 'grabbing' : 'grab';
      return;
    }

    if (canvas) canvas.style.cursor = 'pointer';
    const left = Math.min(window.innerWidth - 250, clientX + 14);
    const top = Math.min(window.innerHeight - 95, clientY + 14);
    tip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    tip.style.opacity = '1';

    const dotEl = tip.querySelector('[data-tip-dot]');
    const titleEl = tip.querySelector('[data-tip-title]');
    const metaEl = tip.querySelector('[data-tip-meta]');
    if (dotEl) dotEl.style.backgroundColor = node.eraColor;
    if (titleEl) titleEl.textContent = node.label;
    if (metaEl) {
      metaEl.textContent = `${node.origin_raw || node.eraId} • ${node.parents.length} roots · ${node.children.length} branches`;
    }
  }, []);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cam = cameraRef.current;
      const factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
      const newScale = Math.max(0.14, Math.min(3.5, cam.targetScale * factor));

      const worldX = (mouseX - cam.targetX) / cam.targetScale;
      const worldY = (mouseY - cam.targetY) / cam.targetScale;

      cam.targetScale = newScale;
      cam.targetX = mouseX - worldX * newScale;
      cam.targetY = mouseY - worldY * newScale;
      dirtyRef.current = true;
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handlePointerDown = (e) => {
    const cam = cameraRef.current;
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origCamX: cam.x,
      origCamY: cam.y,
      pinchDist: 0,
      origCamScale: cam.scale,
    };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    const drag = dragStateRef.current;
    if (drag.active) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        drag.moved = true;
      }
      const nx = drag.origCamX + dx;
      const ny = drag.origCamY + dy;
      cameraRef.current.x = nx;
      cameraRef.current.y = ny;
      cameraRef.current.targetX = nx;
      cameraRef.current.targetY = ny;
      dirtyRef.current = true;

      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        updateHoverTooltip(null, 0, 0);
      }
      return;
    }

    const hit = findNodeAtScreenPos(e.clientX, e.clientY);
    const nextHoverId = hit ? hit.id : null;
    if (nextHoverId !== hoveredIdRef.current) {
      hoveredIdRef.current = nextHoverId;
      dirtyRef.current = true;
    }
    updateHoverTooltip(hit, e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    const drag = dragStateRef.current;
    const wasClick = drag.active && !drag.moved;
    drag.active = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredIdRef.current ? 'pointer' : 'grab';
    }

    if (wasClick) {
      const hit = findNodeAtScreenPos(e.clientX, e.clientY);
      if (hit) {
        setSelectedId(hit.id);
      } else {
        setSelectedId(null);
        setFocusLineageOnly(false);
      }
    }
  };

  const handleTouchStart = (e) => {
    const cam = cameraRef.current;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStateRef.current = {
        active: true,
        moved: false,
        startX: t.clientX,
        startY: t.clientY,
        origCamX: cam.x,
        origCamY: cam.y,
        pinchDist: 0,
        origCamScale: cam.scale,
      };
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      dragStateRef.current = {
        active: true,
        moved: true,
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        origCamX: cam.x,
        origCamY: cam.y,
        pinchDist: dist,
        origCamScale: cam.scale,
      };
    }
  };

  const handleTouchMove = (e) => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    if (e.touches.length === 1 && drag.pinchDist === 0) {
      const t = e.touches[0];
      const dx = t.clientX - drag.startX;
      const dy = t.clientY - drag.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.moved = true;
      const nx = drag.origCamX + dx;
      const ny = drag.origCamY + dy;
      cameraRef.current.x = nx;
      cameraRef.current.y = ny;
      cameraRef.current.targetX = nx;
      cameraRef.current.targetY = ny;
      dirtyRef.current = true;
    } else if (e.touches.length === 2 && drag.pinchDist > 0) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = dist / drag.pinchDist;
      const newScale = Math.max(0.14, Math.min(3.5, drag.origCamScale * scaleFactor));
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const worldX = (drag.startX - drag.origCamX) / drag.origCamScale;
      const worldY = (drag.startY - drag.origCamY) / drag.origCamScale;
      const nx = midX - worldX * newScale;
      const ny = midY - worldY * newScale;
      cameraRef.current = {
        x: nx,
        y: ny,
        scale: newScale,
        targetX: nx,
        targetY: ny,
        targetScale: newScale,
      };
      if (zoomTextRef.current) {
        zoomTextRef.current.textContent = `${Math.round(newScale * 100)}%`;
      }
      dirtyRef.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    const drag = dragStateRef.current;
    if (drag.active && !drag.moved && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const hit = findNodeAtScreenPos(t.clientX, t.clientY);
      if (hit) {
        setSelectedId(hit.id);
      } else {
        setSelectedId(null);
        setFocusLineageOnly(false);
      }
    }
    drag.active = false;
  };

  const stepZoom = (multiplier) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const cam = cameraRef.current;
    const newScale = Math.max(0.14, Math.min(3.5, cam.targetScale * multiplier));
    const wx = (cx - cam.targetX) / cam.targetScale;
    const wy = (cy - cam.targetY) / cam.targetScale;
    cam.targetScale = newScale;
    cam.targetX = cx - wx * newScale;
    cam.targetY = cy - wy * newScale;
    dirtyRef.current = true;
  };

  // Selected node metadata for slide-over Inspector Drawer
  const selectedNode = selectedId ? graph.nodeMap.get(selectedId) : null;
  const parsedSwatches = useMemo(
    () => (selectedNode ? parseColourSwatches(selectedNode.colours) : []),
    [selectedNode]
  );
  const motifTags = useMemo(() => {
    if (!selectedNode?.motifs) return [];
    return selectedNode.motifs
      .split(/[,•;\n]+/)
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, 14);
  }, [selectedNode]);
  const platformTags = useMemo(() => {
    if (!selectedNode?.platform) return [];
    return selectedNode.platform
      .split(/[,•;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [selectedNode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#090d16] text-slate-100 overflow-hidden select-none font-sans"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileObject(file);
          e.target.value = '';
        }}
      />

      {/* Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          dragStateRef.current.active = false;
          if (hoveredIdRef.current !== null) {
            hoveredIdRef.current = null;
            dirtyRef.current = true;
          }
          updateHoverTooltip(null, 0, 0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block w-full h-full touch-none cursor-grab"
      />

      {/* ====================================================================
          TOP HEADER BAR (Search, Dataset Badge, Upload JSON)
         ==================================================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14 px-4 bg-[#090d16]/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <GitBranch size={17} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">
                Aesthetics<span className="text-fuchsia-400">Wiki</span>
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                Chronological Tree Explorer
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <FileJson size={13} className="text-cyan-400 shrink-0" />
            <span className="font-medium truncate max-w-[160px]">{datasetSourceName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              {filteredNodes.length.toLocaleString()}/{graph.nodes.length.toLocaleString()} nodes
            </span>
          </div>
        </div>

        {/* Instant Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search aesthetics, motifs, platforms... ( / )"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-slate-900/95 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/70 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-500 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searchFocused && searchQuery.trim() !== '' && (
            <div className="absolute top-11 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  No aesthetics matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery('');
                      setSearchFocused(false);
                      if (item.eraId === 'Undated') setShowUndated(true);
                      if (item.degree === 0) setHideIsolated(false);
                      setFocusLineageOnly(false);
                      setTimeout(() => focusNode(item.id, true), 30);
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/90 border-b border-slate-800/60 last:border-none flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.eraColor }}
                        />
                        <span className="text-sm font-semibold text-white truncate">
                          {item.label}
                        </span>
                      </div>
                      {item.motifs && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 pl-4">
                          {item.motifs}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300">
                        {item.year ?? 'Undated'}
                      </span>
                      <span className="text-[11px] text-slate-500">{item.degree} links</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCustomDataset && (
            <button
              onClick={() => {
                setRawDataset(BUILTIN_DATASET);
                setDatasetSourceName('Built-in Sample (1850–2026)');
                setIsCustomDataset(false);
                setHideIsolated(false);
                setFocusLineageOnly(false);
                setSelectedId('Cyberpunk');
                triggerToast('Restored built-in sample dataset', 'info');
              }}
              className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
              title="Reset to built-in sample data"
            >
              <RotateCcw size={13} />
              <span>Sample</span>
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-fuchsia-600/25 transition-all cursor-pointer"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload aesthetics_data.json</span>
            <span className="sm:hidden">Upload JSON</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          LEFT FLOATING CONTROLS & LEGEND PANEL
         ==================================================================== */}
      <aside className="absolute top-16 left-4 z-20 flex flex-col gap-2 max-w-[260px]">
        <button
          onClick={() => setShowFilterPanel((v) => !v)}
          className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-200 shadow-lg transition-colors"
        >
          <SlidersHorizontal size={13} className="text-fuchsia-400" />
          <span>{showFilterPanel ? 'Hide Controls' : 'Filters & Legend'}</span>
        </button>

        {showFilterPanel && (
          <div className="bg-slate-900/88 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3.5 text-xs">
            <div>
              <button
                disabled={!selectedNode}
                onClick={() => setFocusLineageOnly((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  !selectedNode
                    ? 'bg-slate-950/60 text-slate-600 border border-slate-800/60 cursor-not-allowed'
                    : focusLineageOnly
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-inner'
                    : 'bg-slate-950 hover:bg-slate-800/80 text-slate-200 border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Compass size={14} className={focusLineageOnly ? 'text-fuchsia-400' : 'text-slate-400'} />
                  Focus Lineage Only
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                    focusLineageOnly ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {focusLineageOnly ? 'On' : 'Off'}
                </span>
              </button>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye size={11} /> Node Visibility
              </div>

              <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
                <span>Hide Isolated</span>
                <input
                  type="checkbox"
                  checked={hideIsolated}
                  onChange={(e) => setHideIsolated(e.target.checked)}
                  className="accent-fuchsia-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
                <span>Undated</span>
                <input
                  type="checkbox"
                  checked={showUndated}
                  onChange={(e) => setShowUndated(e.target.checked)}
                  className="accent-fuchsia-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers size={11} /> Edge Layers
              </div>

              <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
                <span>Subgenres</span>
                <input
                  type="checkbox"
                  checked={showSubgenres}
                  onChange={(e) => setShowSubgenres(e.target.checked)}
                  className="accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
                <span>Chronological Links</span>
                <input
                  type="checkbox"
                  checked={showChronological}
                  onChange={(e) => setShowChronological(e.target.checked)}
                  className="accent-amber-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-0.5 text-slate-300 hover:text-white">
                <span>Lateral Overlaps</span>
                <input
                  type="checkbox"
                  checked={showOverlaps}
                  onChange={(e) => setShowOverlaps(e.target.checked)}
                  className="accent-purple-400 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Lineage Legend
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 ring-2 ring-fuchsia-400/30" />
                <span>Selected Aesthetic</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Upstream Ancestors</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Downstream Descendants</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 border-t-2 border-dashed border-purple-400" />
                <span>Lateral Overlaps</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ====================================================================
          BOTTOM-LEFT ZOOM & FIT VIEW CONTROLS
         ==================================================================== */}
      <div className="absolute bottom-5 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => stepZoom(1.28)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <span
          ref={zoomTextRef}
          className="text-[11px] font-mono text-slate-400 px-1.5 min-w-[44px] text-center"
        >
          85%
        </span>
        <button
          onClick={() => stepZoom(1 / 1.28)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-px h-5 bg-slate-800 mx-0.5" />
        <button
          onClick={() => fitToScreen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
          title="Fit View"
        >
          <Maximize2 size={14} />
          <span className="hidden sm:inline">Fit View</span>
        </button>
      </div>

      {/* ====================================================================
          IMPERATIVE ZERO-RERENDER HOVER TOOLTIP
         ==================================================================== */}
      <div
        ref={tooltipRef}
        style={{ opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}
        className="fixed z-40 px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl max-w-xs transition-opacity duration-75 will-change-transform"
      >
        <div className="flex items-center gap-2">
          <span data-tip-dot className="w-2.5 h-2.5 rounded-full shrink-0" />
          <span data-tip-title className="text-xs font-bold text-white truncate" />
        </div>
        <div data-tip-meta className="text-[11px] text-slate-400 mt-1" />
      </div>

      {/* ====================================================================
          RIGHT SLIDE-OVER INSPECTOR DRAWER
         ==================================================================== */}
      <aside
        className={`absolute top-14 right-0 bottom-0 z-20 w-full sm:w-[390px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/90 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          selectedNode ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedNode && (
          <>
            <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-950 border-b border-slate-800">
              {selectedNode.image && !imgError ? (
                <img
                  src={selectedNode.image}
                  alt={selectedNode.label}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center opacity-85"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(circle at 25% 25%, ${selectedNode.eraColor}44, #090d16 75%)`,
                  }}
                >
                  <span className="text-5xl font-black tracking-tighter text-white/10 select-none">
                    {selectedNode.label.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

              <button
                onClick={() => {
                  setSelectedId(null);
                  setFocusLineageOnly(false);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/75 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
                title="Close Inspector"
              >
                <X size={16} />
              </button>

              <div className="absolute bottom-3 left-5 right-5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-950"
                    style={{ backgroundColor: selectedNode.eraColor }}
                  >
                    {selectedNode.eraId}
                  </span>
                  {selectedNode.year && (
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {selectedNode.origin_raw || selectedNode.year}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-white leading-tight truncate">
                  {selectedNode.label}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-amber-400 font-semibold">
                    {lineage.ancestorNodes.size} ancestors
                  </span>
                  <span>•</span>
                  <span className="text-cyan-400 font-semibold">
                    {lineage.descendantNodes.size} descendants
                  </span>
                </div>
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-fuchsia-300 text-xs font-semibold transition-colors"
                >
                  <span>Aesthetics Wiki</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {(selectedNode.location || platformTags.length > 0) && (
                <div className="grid grid-cols-1 gap-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                  {selectedNode.location && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                          Origin Location
                        </span>
                        <span className="text-slate-200">{selectedNode.location}</span>
                      </div>
                    </div>
                  )}
                  {platformTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {platformTags.map((plat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-[11px] text-slate-300"
                        >
                          {plat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedNode.colours && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Palette size={13} className="text-fuchsia-400" /> Key Colours
                  </h3>
                  {parsedSwatches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedSwatches.map((sw, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-200"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: sw.hex }}
                          />
                          <span className="capitalize text-[11px]">{sw.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">{selectedNode.colours}</p>
                  )}
                </div>
              )}

              {motifTags.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" /> Key Motifs
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {motifTags.map((motif, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-200"
                      >
                        {motif}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <ArrowUpRight size={13} /> Influences & Roots ({selectedNode.parents.length})
                  </h4>
                  {selectedNode.parents.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.parents.map((pId) => {
                        const pNode = graph.nodeMap.get(pId);
                        return (
                          <button
                            key={pId}
                            onClick={() => focusNode(pId, true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <span>{pNode?.label || pId}</span>
                            {pNode?.year && (
                              <span className="text-[10px] text-amber-400/75">{pNode.year}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Root aesthetic (no earlier links)</p>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                    <ArrowDownRight size={13} /> Subgenres & Successors ({selectedNode.children.length})
                  </h4>
                  {selectedNode.children.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.children.map((cId) => {
                        const cNode = graph.nodeMap.get(cId);
                        return (
                          <button
                            key={cId}
                            onClick={() => focusNode(cId, true)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <span>{cNode?.label || cId}</span>
                            {cNode?.year && (
                              <span className="text-[10px] text-cyan-400/75">{cNode.year}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No recorded downstream branches</p>
                  )}
                </div>

                {selectedNode.peers.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                      Lateral Overlaps & Peers ({selectedNode.peers.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.peers.map((peerId) => {
                        const peerNode = graph.nodeMap.get(peerId);
                        return (
                          <button
                            key={peerId}
                            onClick={() => focusNode(peerId, true)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium transition-colors"
                          >
                            {peerNode?.label || peerId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ====================================================================
          FULL-SCREEN DRAG & DROP OVERLAY
         ==================================================================== */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/90 backdrop-blur-md flex items-center justify-center p-6 pointer-events-none">
          <div className="w-full max-w-md p-8 rounded-3xl border-2 border-dashed border-fuchsia-400 bg-slate-900/90 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
              <FileJson size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Drop aesthetics_data.json</h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Release to parse nodes, normalize eras, and render the full chronological tree
            </p>
          </div>
        </div>
      )}

      {/* ====================================================================
          NON-BLOCKING STATUS TOAST
         ==================================================================== */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-slate-900/95 border-slate-700 text-slate-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
          ) : (
            <Sparkles size={15} className="text-fuchsia-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}