# Discover Player - Component Architecture

## Component Hierarchy

```
MusicDiscoveryPage
├── AnimatedBackground (existing)
├── DiscoverHeader
│   ├── Title & Subtitle
│   └── CustomLoginButton (existing)
│
├── Mobile Layout (< 768px)
│   ├── NowPlayingCard (sticky)
│   │   ├── YouTubeTrackPlayer / Album Artwork
│   │   ├── Track Info (title, artist, context)
│   │   ├── PlayerControls
│   │   │   ├── Previous Button
│   │   │   ├── Play/Pause Button
│   │   │   └── Next Button
│   │   ├── ProgressBar
│   │   │   ├── Progress Track
│   │   │   ├── Time Display
│   │   │   └── Playhead
│   │   └── Secondary Actions
│   │       ├── Upvote Button
│   │       ├── Downvote Button
│   │       ├── Share Button
│   │       └── DSP Stream Button
│   │
│   └── TrackList
│       └── Track Items
│           ├── Track Number / Play Indicator / Equalizer
│           ├── Album Artwork
│           ├── Track Info
│           ├── Type Badges
│           └── Duration
│
├── Desktop Layout (≥ 768px)
│   ├── Left Column (sticky)
│   │   └── NowPlayingCard (same as mobile)
│   │
│   └── Right Column
│       ├── DiscoverHeader
│       └── TrackList (same as mobile)
│
└── DspSheet (modal)
    ├── Backdrop
    └── Bottom Sheet
        ├── Drag Handle
        ├── Header (title, close button)
        └── Platform Options
            ├── Spotify Link
            ├── Apple Music Link
            └── YouTube Music Link
```

## Component Details

### DiscoverHeader
**File:** `src/components/discover/DiscoverHeader.tsx`
**Props:**
- `className?: string`

**Features:**
- Displays "Discover" title and "Weekly curated tracks" subtitle
- Shows login button or user profile
- Responsive visibility (hidden on mobile in some layouts)

---

### PlayerControls
**File:** `src/components/discover/PlayerControls.tsx`
**Props:**
```typescript
{
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
}
```

**Features:**
- Large centered play/pause button (56px)
- Previous/next buttons (44px)
- Gradient styling on primary button
- Scale animations on interaction
- ARIA labels for accessibility

---

### ProgressBar
**File:** `src/components/discover/ProgressBar.tsx`
**Props:**
```typescript
{
  progress: number;        // 0-100
  duration: number;        // seconds
  currentTime: number;     // seconds
  onSeek: (position: number) => void;
  className?: string;
}
```

**Features:**
- Interactive progress bar
- Hover preview indicator
- Time formatting (MM:SS)
- Keyboard navigation (Arrow keys)
- Smooth gradient fill animation
- Accessible slider (ARIA)

---

### NowPlayingCard
**File:** `src/components/discover/NowPlayingCard.tsx`
**Props:**
```typescript
{
  track: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  volume: number;
  isAuthenticated: boolean;
  userVote: 'upvote' | 'downvote' | null;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (position: number) => void;
  onVote: (voteType: 'upvote' | 'downvote') => void;
  onShare: () => void;
  youtubePlayerRef?: React.MutableRefObject<YouTubePlayerHandle | null>;
  onYouTubeStateChange?: (state: number) => void;
  onYouTubeTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}
```

**Features:**
- Square album artwork or YouTube player
- Track title, artist, context label
- Integrated PlayerControls
- Integrated ProgressBar
- Vote buttons with login gating
- Share button
- Primary DSP button
- Opens DspSheet modal
- Gradient background with blur

---

### TrackList
**File:** `src/components/discover/TrackList.tsx`
**Props:**
```typescript
{
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track, index: number) => void;
  className?: string;
}
```

**Features:**
- Scrollable vertical list
- Active track highlighting (purple gradient + border)
- Animated equalizer on playing track
- Track number / play indicator
- Album artwork thumbnails
- Track type badges (YouTube/Audio)
- Duration display
- Auto-scroll to active track
- Staggered entrance animations
- Hover states with play preview

---

### DspSheet
**File:** `src/components/discover/DspSheet.tsx`
**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}
```

**Features:**
- Bottom sheet modal
- Backdrop with blur
- Drag handle indicator
- Platform-specific buttons:
  - Spotify (green)
  - Apple Music (pink)
  - YouTube Music (red)
- Spring animation
- Escape key handler
- Click outside to dismiss
- Safe area padding
- Filters out unavailable platforms

---

## Data Flow

### Global State (MusicPlayerContext)
```typescript
{
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loading: boolean;
  error: string | null;
  youtubePlayerRef: React.MutableRefObject<YouTubePlayerHandle | null>;
  
  // Actions
  playTrack: (track: Track, options?) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (position: number) => void;
  reloadTracks: () => Promise<void>;
}
```

### Local State (MusicDiscoveryPage)
```typescript
{
  youtubeProgress: number;
  youtubeDuration: number;
  isMobile: boolean;
  userVotes: Record<string, 'upvote' | 'downvote' | null>;
}
```

### Local State (NowPlayingCard)
```typescript
{
  isDspSheetOpen: boolean;
}
```

---

## Event Handlers

### MusicDiscoveryPage
- `handlePlayTrack(track, index)` - Plays selected track
- `handleVote(trackId, voteType)` - Handles voting with auth check
- `handleShare()` - Shares current track URL
- `handleYouTubeStateChange(state)` - YouTube player state callback
- `handleYouTubeTimeUpdate(currentTime, duration)` - YouTube progress callback

### NowPlayingCard
- Delegates most handlers to parent
- Manages DSP sheet open/close state

### TrackList
- `onTrackSelect` - Bubbles up to parent

---

## Styling Approach

### Tailwind Utility Classes
- Consistent spacing scale (2, 3, 4, 6, 8)
- Gradient backgrounds (`from-purple-600 to-pink-600`)
- Backdrop blur (`backdrop-blur-xl`)
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Opacity levels (`/10`, `/20`, `/60`, `/80`)

### Framer Motion Animations
- `whileTap={{ scale: 0.95 }}` - Button press feedback
- `whileHover={{ scale: 1.05 }}` - Hover feedback
- `initial/animate` - Entrance animations
- Spring transitions for bottom sheet

### Custom Classes
- `.touch-target` - Ensures 44px minimum
- `.focus-ring` - Consistent focus outlines
- `.scrollbar-thin` - Custom scrollbar styling

---

## Accessibility Features

### ARIA Attributes
- `aria-label` on all icon-only buttons
- `role="slider"` on progress bar
- `role="dialog"` on bottom sheet
- `aria-modal="true"` on modal
- `aria-valuemin/max/now` on slider

### Keyboard Support
- Tab navigation through all elements
- Arrow keys for progress bar seeking
- Escape key to close modals
- Enter/Space to activate buttons

### Visual Indicators
- Focus outlines on all interactive elements
- Clear active states
- Sufficient color contrast (WCAG AA)
- Text alternatives for icons

---

## Performance Optimizations

### React Best Practices
- Proper dependency arrays in useEffect
- Callback memoization with useCallback
- Conditional rendering to avoid unnecessary work
- Cleanup functions for event listeners

### Animation Performance
- CSS transforms (not layout properties)
- GPU-accelerated properties
- Framer Motion's optimized animations
- Reduced motion support (via Tailwind)

### Loading Strategies
- Progressive image loading
- Lazy component rendering
- Efficient re-render prevention
- Smooth scroll behavior

---

## Integration Points

### Existing Components Used
- `CustomLoginButton` - Authentication
- `YouTubeTrackPlayer` - Video playback
- `AnimatedBackground` - Visual effects
- `SpotifyIcon` - Platform icon

### Existing Contexts Used
- `MusicPlayerContext` - Global player state
- `useAuthStore` - Authentication state

### Existing Utilities Used
- `getMediaUrl()` - Media URL resolution
- `api.tracks.*` - API calls
- `useSearchParams` - URL parameter handling

