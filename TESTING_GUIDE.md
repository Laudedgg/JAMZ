# Discover Player Redesign - Testing Guide

## Quick Start

### 1. Start MongoDB
```bash
# In terminal 1
mongod --port 27018 --dbpath ./mongodb-data
```

### 2. Start Backend Server
```bash
# In terminal 2
cd backend
npm install  # If not already installed
npm start
```

### 3. Start Frontend Development Server
```bash
# In terminal 3 (from project root)
npm run dev
```

### 4. Open Browser
Navigate to: `http://localhost:3000/discover`

## Testing Scenarios

### Scenario 1: First Load Experience
**Expected Behavior:**
1. Page loads with "Discover" header
2. Track list populates with available tracks
3. Now Playing Card shows "No track selected" state
4. Login button visible in header (if not authenticated)

**Test:**
- Verify loading state appears briefly
- Verify tracks load successfully
- Check console for any errors

---

### Scenario 2: Playing a Track
**Steps:**
1. Click any track in the track list
2. Observe Now Playing Card updates
3. Check playback controls

**Expected Behavior:**
- Track artwork/YouTube player appears
- Track title and artist display correctly
- Play button changes to Pause button
- Progress bar starts moving
- Active track in list has purple gradient background
- Animated equalizer bars appear on active track
- Track auto-scrolls into view if needed

---

### Scenario 3: Playback Controls
**Test Previous/Next:**
1. Click Next button → Should play next track
2. Click Previous button → Should play previous track
3. Verify active track highlighting updates

**Test Play/Pause:**
1. Click Pause → Playback stops, equalizer stops
2. Click Play → Playback resumes, equalizer animates

**Test Progress Bar:**
1. Click anywhere on progress bar → Playback seeks to that position
2. Hover over progress bar → Preview indicator appears
3. Use keyboard: Arrow Right → Seeks forward 5%
4. Use keyboard: Arrow Left → Seeks backward 5%

---

### Scenario 4: Voting System (Logged Out)
**Steps:**
1. Ensure you're logged out
2. Click upvote or downvote button

**Expected Behavior:**
- Lock icon visible on vote buttons
- Tooltip shows "Log in to vote"
- Click prompts login confirmation dialog
- Vote counts display correctly

---

### Scenario 5: Voting System (Logged In)
**Steps:**
1. Click Login button and authenticate
2. Click upvote button on current track
3. Click downvote button on current track

**Expected Behavior:**
- Upvote button highlights green when active
- Downvote button highlights red when active
- Vote counts increment/decrement
- Can toggle vote off by clicking same button again

---

### Scenario 6: DSP Links
**Steps:**
1. Click "Stream" button on Now Playing Card
2. Observe bottom sheet animation
3. Click a platform (Spotify/Apple Music/YouTube)

**Expected Behavior:**
- Bottom sheet slides up smoothly
- Backdrop appears with blur effect
- All available platforms shown with icons
- Clicking platform opens in new tab
- Clicking backdrop dismisses sheet
- Pressing Escape key dismisses sheet

---

### Scenario 7: Share Functionality
**Steps:**
1. Play a track
2. Click Share button

**Expected Behavior:**
- On mobile with Web Share API: Native share dialog appears
- On desktop: Link copied to clipboard, alert shows
- Shared URL format: `http://localhost:3000/discover?track=TRACK_ID`

---

### Scenario 8: Deep Linking
**Steps:**
1. Get a track ID from the track list
2. Navigate to: `http://localhost:3000/discover?track=TRACK_ID`

**Expected Behavior:**
- Page loads with that specific track playing
- Track is highlighted in the list
- Now Playing Card shows the track

---

### Scenario 9: Mobile Responsive Design
**Steps:**
1. Open Chrome DevTools (F12)
2. Click Toggle Device Toolbar (Ctrl+Shift+M)
3. Select different devices:
   - iPhone SE (375x667)
   - iPhone 12 (390x844)
   - Pixel 5 (393x851)
   - Galaxy S21 (360x800)

**Expected Behavior:**
- Single column layout on mobile
- Now Playing Card is sticky at top
- Track list scrolls below
- All buttons are minimum 44px tap targets
- Text truncates properly
- No horizontal scrolling
- Bottom sheet respects safe areas

---

### Scenario 10: Desktop Responsive Design
**Steps:**
1. Resize browser to > 768px width
2. Observe layout change

**Expected Behavior:**
- Two-column grid layout
- Now Playing Card on left (sticky)
- Track list on right with header
- Hover states appear on buttons
- Progress bar shows hover preview

---

### Scenario 11: Accessibility - Keyboard Navigation
**Steps:**
1. Use Tab key to navigate through elements
2. Use Shift+Tab to navigate backwards
3. Press Enter/Space on focused buttons
4. Use Arrow keys on progress bar

**Expected Behavior:**
- Clear focus outlines on all elements
- Logical tab order
- All buttons activatable with keyboard
- Progress bar seekable with arrows
- Bottom sheet closable with Escape

---

### Scenario 12: Accessibility - Screen Reader
**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate through the page

**Expected Behavior:**
- All buttons have descriptive labels
- "Play" or "Pause" announced correctly
- "Previous track" and "Next track" announced
- Vote buttons announce "Upvote track" or "Log in to vote"
- Progress bar announces current position
- Track list items announce track info

---

## Visual Regression Checklist

### Now Playing Card
- [ ] Square aspect ratio maintained
- [ ] Rounded corners (16px)
- [ ] Gradient background visible
- [ ] Backdrop blur effect
- [ ] Text truncates with ellipsis
- [ ] Buttons have proper spacing
- [ ] Vote counts display correctly
- [ ] Progress bar fills smoothly

### Track List
- [ ] Active track has purple gradient
- [ ] Active track has left border (4px)
- [ ] Equalizer animates when playing
- [ ] Track numbers visible when not active
- [ ] Play icon appears on hover
- [ ] Album artwork loads correctly
- [ ] Track type badges visible
- [ ] Duration aligned to right

### DSP Bottom Sheet
- [ ] Slides up from bottom
- [ ] Backdrop blur visible
- [ ] Drag handle centered
- [ ] Platform buttons full width
- [ ] Icons and labels aligned
- [ ] Gradient backgrounds correct
- [ ] Safe area padding on mobile

### Header
- [ ] Title and subtitle visible
- [ ] Login/Profile button aligned right
- [ ] User avatar shows when logged in
- [ ] Responsive on mobile

---

## Performance Checklist

- [ ] No layout shift on load
- [ ] Smooth scroll to active track
- [ ] Animations run at 60fps
- [ ] No jank when opening bottom sheet
- [ ] Progress bar updates smoothly
- [ ] Track list renders quickly (< 100ms)
- [ ] Images load progressively
- [ ] No memory leaks (check DevTools)

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Known Issues / Limitations

1. **MongoDB Required**: Backend needs MongoDB running on port 27018
2. **YouTube API**: Some tracks may require YouTube API key for playback
3. **Authentication**: Wallet connection required for voting

---

## Troubleshooting

### Tracks Not Loading
- Check MongoDB is running: `mongod --port 27018`
- Check backend is running: `cd backend && npm start`
- Check backend logs for errors
- Verify API endpoint: `http://localhost:3001/api/tracks`

### YouTube Player Not Working
- Check browser console for errors
- Verify YouTube URL is valid
- Check network tab for blocked requests

### Voting Not Working
- Ensure you're logged in
- Check authentication token in localStorage
- Verify backend API is responding

### Bottom Sheet Not Appearing
- Check browser console for errors
- Verify track has DSP links (spotifyUrl, appleMusicUrl, or youtubeUrl)
- Check z-index stacking

---

## Success Criteria

✅ All 12 test scenarios pass
✅ No TypeScript errors
✅ No console errors
✅ Accessibility score > 90 (Lighthouse)
✅ Performance score > 80 (Lighthouse)
✅ Works on all target browsers
✅ Responsive on all device sizes
✅ All existing functionality preserved

