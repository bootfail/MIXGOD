# Feature Landscape

**Domain:** AI-powered audio mixing workstation / automated DJ mix creation
**Researched:** 2026-03-16

## Table Stakes

Features users expect from any AI mixing tool. Missing = product feels broken or amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| BPM detection & beatmatching | Every DJ tool does this. Automix without sync = garbage | Medium | Use aubio or essentia for detection. Must handle variable BPM tracks (live recordings) |
| Key detection (Camelot wheel) | Harmonic mixing is standard since Mixed In Key popularized it. DJ.Studio, djay Pro, VirtualDJ all do this | Medium | Map to Camelot notation (e.g. 8A, 5B). Open Camelot Wheel rules: same key, +/-1, parallel major/minor |
| Track import (MP3, WAV, FLAC) | DJ.Studio got complaints for NOT supporting FLAC. All three formats are mandatory | Low | FLAC support is non-negotiable. DJ.Studio users specifically complained about missing lossless support |
| Waveform visualization | Every DAW and DJ tool shows waveforms. Users need visual confirmation of what they hear | Medium | Scrollable timeline with zoom. Color-coded by frequency content (low=red, mid=green, high=blue) common in DJ tools |
| Basic crossfade transitions | The minimum viable transition. Even Spotify crossfades tracks | Low | Volume crossfade with adjustable duration. Baseline that all other transition types build on |
| Tempo sync / beatmatching | Foundation of modern DJ mixing. Listeners notice misaligned beats immediately | Medium | Phase-aligned beat sync, not just BPM matching. Must lock to downbeat/bar start |
| Track ordering suggestions | DJ.Studio, Mixed In Key, PulseDJ all suggest track order. Expected from any "AI" mixing tool | Medium | Score combinations by key compatibility + BPM proximity + energy flow |
| Project save/load | Basic workflow requirement. Losing a mix-in-progress is a dealbreaker | Low | JSON project state. Include all analysis data, track references, transition settings |
| Audio preview/playback | Users must hear what they're building. DJ.Studio, VirtualDJ all have real-time preview | High | Web Audio API for browser playback. This is technically complex but absolutely required |
| Volume normalization | Tracks from different sources have wildly different loudness. Unbalanced = amateur sound | Low | LUFS-based normalization. Target -14 LUFS for streaming, -8 to -10 for club/party |
| Export to audio file | The end goal is a playable mix file. MP3 and WAV export minimum | Medium | Server-side render for quality. Browser-rendered audio quality is insufficient for party speakers |

## Differentiators

Features that set MIXGOD apart. Not expected by users, but deliver the "next-level" experience described in the project vision.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Energy wave designer** | Define a visual energy curve ("golven" pattern) that the AI follows when ordering tracks and designing transitions. No existing tool does this as a first-class concept. DJ.Studio suggests order but doesn't let you draw a target energy shape | High | Core differentiator. UI: drawable bezier curve. AI maps tracks to curve positions. Supports the "build up - drop - breathe - build higher - drop harder" pattern explicitly. Mixed In Key rates energy 1-10 per track; MIXGOD should use this concept but let users shape the overall journey |
| **Extreme BPM range transitions (100-200+)** | The 100 BPM Dutch party to 180+ BPM frenchcore journey is MIXGOD's primary use case. No AI tool handles this well automatically. DJ software documents it as a manual advanced technique | Very High | Transition strategies: gradual tempo ramp over 2-4 tracks, double-time trick (100 BPM = 200 BPM if you count 16ths), genre "bridge" tracks, breakdown-to-buildup cuts. Must encode DJ knowledge about tempo bridging |
| **AI transition strategy selection** | Per-transition intelligence: "this pair works best with a filter sweep", "this needs a hard cut on the drop", "these overlap well as a mashup". DJ.Studio has transition presets but not intelligent per-pair selection | High | Classify transitions: crossfade, cut, mashup, FX-bridge, breakdown-swap, tempo-ramp. LLM or rule engine scores each strategy per track pair based on genre, BPM delta, energy delta, key relationship |
| **Stem separation for mashups** | Layer vocals from track A over instrumentals of track B. RaveDJ does this poorly (YouTube quality, no control). DJ.Studio has stems but limited mashup workflow | High | Use Demucs (Meta) for 4-stem separation (vocals/drums/bass/other). Demucs v4 quality is significantly better than Spleeter. Store stems server-side, mix in timeline |
| **Genre-aware transition intelligence** | Understanding that Dutch party music -> hardstyle needs a different transition approach than house -> house. Current tools treat all genre transitions the same | High | Genre classification per track. Transition rule database: "feest to hardstyle = use energy buildup + tempo ramp", "hardstyle to frenchcore = kick pattern bridge or breakdown cut" |
| **Visual transition editor with per-parameter automation** | DJ.Studio has this (volume, EQ, filter lanes). MIXGOD needs it too, but with stem-aware automation: fade out vocals of track A while keeping drums, bring in bass of track B first | High | Automation lanes per stem per track. Goes beyond DJ.Studio which automates full-track parameters. Stem-level control enables much more creative transitions |
| **"Adrenaline rush" moments** | Surprise genre switches or throwbacks that break the expected flow intentionally. No tool supports this as a concept | Medium | User marks moments on the energy curve as "surprise". AI selects a track that contrasts with the flow. Could be a sudden BPM drop, a genre throwback, or an unexpected vocal drop |
| **FX engine (risers, buildups, drops)** | Professional mixes use FX to bridge transitions and build energy. RaveDJ completely lacks this. DJ.Studio has basic FX automation | High | Riser/sweep samples, filter automation, echo-out tails, reverse cymbal hits. Library of DJ FX that can be placed on timeline. Critical for genre transitions where tracks don't blend naturally |
| **Intelligent loop extraction** | Auto-detect loopable sections (4/8/16 bar phrases) for extending tracks during transitions or creating bridges between incompatible tracks | Medium | Beat-grid aligned loop detection. Find sections with clean phrase boundaries. Used to extend a track while tempo-ramping into the next genre |

## Anti-Features

Things to deliberately NOT build. These would waste time or harm the product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Live DJ performance mode | Out of scope (per PROJECT.md). Adds massive real-time latency requirements. MIXGOD is a studio/prep tool, not a performance tool | Focus on offline mix creation with browser preview for review. Server-side render for final output |
| Streaming service integration (Spotify/YouTube) | Copyright issues, audio quality problems (RaveDJ suffers from YouTube compression), adds complexity for sourcing. User provides own files | Clean file upload flow (drag & drop). Support MP3/WAV/FLAC. No API integrations needed |
| Social/sharing platform | Feature creep. Building a social platform is a separate product entirely | Export finished mix as audio file. User shares via their own channels |
| Hardware controller / MIDI support | DJ.Studio is adding MIDI in 2026 but it's a live performance feature. MIXGOD is mouse/keyboard operated | Keyboard shortcuts for timeline navigation. Mouse-based editing of transitions and automation |
| Beat grid manual editing | DJ.Studio users complain about beat grid snapping. Building a full beat grid editor is a rabbit hole | Use analysis library with good defaults. Allow override of BPM value per track but don't build a Rekordbox-style grid editor |
| Video mixing | VirtualDJ supports video. Completely orthogonal to audio mixing quality | Audio only. Clean, focused scope |
| AI music generation / voice synthesis | Trendy but irrelevant. MIXGOD mixes existing tracks, it doesn't create new music | Stick to analysis + arrangement + transition design of user-provided tracks |
| Mobile app | Per PROJECT.md, web-first. Responsive layout later. Do not build native mobile | Responsive web design as a later phase, not mobile-native |
| Vinyl emulation / scratch simulation | Performance DJ feature. Irrelevant for pre-recorded mix creation | Cut transitions can achieve similar energy without scratch simulation |

## Feature Dependencies

```
Audio Import
  -> BPM Detection
  -> Key Detection
  -> Energy Analysis
  -> Genre Classification
  -> Stem Separation

BPM Detection + Key Detection
  -> Track Ordering Algorithm
  -> Beatmatching Engine

Energy Analysis + Genre Classification
  -> Energy Wave Designer (needs energy scores to map tracks to curve)
  -> Genre-Aware Transition Intelligence

Track Ordering Algorithm + Beatmatching Engine
  -> AI Transition Strategy Selection
  -> Basic Crossfade Transitions

Stem Separation
  -> Mashup Support (vocals over instrumentals)
  -> Stem-Aware Transition Automation

AI Transition Strategy Selection
  -> FX Engine (strategy determines which FX to apply)
  -> Extreme BPM Range Transitions (specialized strategy type)

Waveform Visualization + Audio Preview
  -> Visual Timeline Editor
  -> Visual Transition Editor

All Above
  -> Server-Side Render (final export needs all processing applied)
```

## MVP Recommendation

For the boat party deadline (early April 2026, ~2-4 weeks), prioritize ruthlessly:

### Phase 1: Functional Mix Generator (Week 1-2)
1. **Audio import + analysis** (BPM, key, energy) -- foundation for everything
2. **Track ordering algorithm** -- AI suggests optimal sequence based on key/BPM/energy
3. **Basic crossfade transitions with beatmatching** -- minimum viable transitions
4. **Waveform timeline with drag-to-reorder** -- user refines AI proposal
5. **Audio preview in browser** -- hear what you're building
6. **Export to WAV/MP3** -- get a playable file

### Phase 2: Creative Transitions (Week 2-3)
7. **Transition type selection** (crossfade, cut, filter sweep, echo-out) -- per-transition
8. **Energy wave designer** -- draw the target energy curve
9. **FX engine** (risers, sweeps, drops) -- bridge difficult transitions
10. **Tempo ramping for BPM transitions** -- handle the 100->180 BPM range

### Phase 3: Mashup & Polish (Week 3-4)
11. **Stem separation** (Demucs) -- enable mashup capability
12. **Mashup editor** -- layer stems from different tracks
13. **Stem-aware transition automation** -- fade individual stems during transitions
14. **Server-side high-quality render** -- party speaker quality output

### Defer to Post-Party
- Genre-aware transition intelligence (encode as simple rules first, ML later)
- Adrenaline rush / surprise moment system
- Advanced loop extraction
- Intelligent loop-based tempo bridging

## Competitive Gaps This Fills

| Gap in Market | Who Has It Partially | MIXGOD Advantage |
|---------------|---------------------|------------------|
| Energy curve as first-class concept | Mixed In Key (per-track rating), DJ.Studio (implicit in ordering) | Drawable energy wave that AI actively targets. "Golven" pattern as a template |
| Extreme BPM range automation | No one -- all tools treat this as manual advanced technique | Built-in transition strategies for 80+ BPM jumps. Genre bridge detection |
| Stem-level transition control | DJ.Studio (track-level only), djay Pro (live stems, not timeline) | Per-stem automation lanes in transition editor |
| Mashup workflow in mix context | RaveDJ (2 tracks only, no control, poor quality) | Multi-track mashup within full mix timeline context |
| All-in-one offline mix creation | DJ.Studio (closest, but SaaS with streaming focus) | Self-hosted, own-files-only, no subscription dependency |

## Sources

- [DJ.Studio - Transition Editor](https://help.dj.studio/en/articles/8106059-transition-editor) -- HIGH confidence
- [DJ.Studio - Automation Editor](https://help.dj.studio/en/articles/8213331-automation-editor-and-effect-blocks) -- HIGH confidence
- [DJ.Studio - AI DJ Automation](https://dj.studio/blog/ai-dj-automation) -- MEDIUM confidence
- [DJ Tech Trends 2026](https://dj.studio/blog/dj-tech) -- MEDIUM confidence
- [ZIPDJ - Best AI DJ Tools 2026](https://www.zipdj.com/blog/best-ai-dj-tools) -- MEDIUM confidence
- [PulseDJ - AI DJ Copilot](https://blog.pulsedj.com/ai-dj-software) -- MEDIUM confidence
- [Mixed In Key - Energy Level Control](https://mixedinkey.com/book/control-the-energy-level-of-your-dj-sets/) -- HIGH confidence
- [Mixed In Key - Camelot Wheel](https://mixedinkey.com/camelot-wheel/) -- HIGH confidence
- [DJ.Studio - BPM Controls](https://help.dj.studio/en/articles/8261956-bpm-controls-tips-and-faqs) -- HIGH confidence
- [DJ.Studio - 9 DJ Tempo Change Techniques](https://dj.studio/blog/dj-tempo-change-techniques) -- MEDIUM confidence
- [StemSplit - DJ Stem Separation Guide](https://stemsplit.io/blog/dj-stem-separation-guide) -- MEDIUM confidence
- [RaveDJ Review](https://aiparabellum.com/ravedj-ai/) -- MEDIUM confidence
- [Algoriddim Neural Mix Pro](https://www.algoriddim.com/neural-mix) -- HIGH confidence
- [Djoid - Music Curation Platform](https://www.djoid.io/) -- LOW confidence
- [Musicianstool - Building the Perfect DJ Set](https://musicianstool.com/blog/building-the-perfect-dj-set-from-scratch) -- MEDIUM confidence
- [DJ.Studio Trustpilot Reviews](https://www.trustpilot.com/review/dj.studio) -- MEDIUM confidence
