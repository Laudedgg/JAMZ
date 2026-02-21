#!/bin/bash

# Script to update Spotify and Apple Music links for all tracks in the Discover page

echo "🎵 Updating DSP links for all tracks..."

# Update each track with Spotify and Apple Music URLs
gcloud compute ssh stayon --zone=us-central1-c --command="mongosh jamz --quiet --eval '
// Levitating - Dua Lipa
db.tracks.updateOne(
  { title: \"Levitating\", artist: \"Dua Lipa\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9\",
    appleMusicUrl: \"https://music.apple.com/us/album/levitating/1590035691?i=1590035845\"
  }}
);
print(\"✅ Updated: Levitating - Dua Lipa\");

// Shivers - Ed Sheeran
db.tracks.updateOne(
  { title: \"Shivers\", artist: \"Ed Sheeran\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/50nfwKoDiSYg8zOCREWAm5\",
    appleMusicUrl: \"https://music.apple.com/us/album/shivers/1581088924?i=1581089357\"
  }}
);
print(\"✅ Updated: Shivers - Ed Sheeran\");

// Stay - The Kid LAROI & Justin Bieber
db.tracks.updateOne(
  { title: \"Stay\", artist: \"The Kid LAROI & Justin Bieber\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/5PjdY0CKGZdEuoNab3yDmX\",
    appleMusicUrl: \"https://music.apple.com/us/album/stay-with-justin-bieber/1576577040?i=1576577617\"
  }}
);
print(\"✅ Updated: Stay - The Kid LAROI & Justin Bieber\");

// Good 4 U - Olivia Rodrigo
db.tracks.updateOne(
  { title: \"Good 4 U\", artist: \"Olivia Rodrigo\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG\",
    appleMusicUrl: \"https://music.apple.com/us/album/good-4-u/1560735414?i=1560735533\"
  }}
);
print(\"✅ Updated: Good 4 U - Olivia Rodrigo\");

// Peaches - Justin Bieber ft. Daniel Caesar & Giveon
db.tracks.updateOne(
  { title: \"Peaches\", artist: \"Justin Bieber ft. Daniel Caesar & Giveon\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI\",
    appleMusicUrl: \"https://music.apple.com/us/album/peaches-feat-daniel-caesar-giveon/1558287974?i=1558288278\"
  }}
);
print(\"✅ Updated: Peaches - Justin Bieber ft. Daniel Caesar & Giveon\");

// Montero (Call Me By Your Name) - Lil Nas X
db.tracks.updateOne(
  { title: \"Montero (Call Me By Your Name)\", artist: \"Lil Nas X\" },
  { \$set: { 
    spotifyUrl: \"https://open.spotify.com/track/67BtfxlNbhBmCDR2L2l8qd\",
    appleMusicUrl: \"https://music.apple.com/us/album/montero-call-me-by-your-name/1561054563?i=1561054571\"
  }}
);
print(\"✅ Updated: Montero (Call Me By Your Name) - Lil Nas X\");

print(\"\n✅ All tracks updated with Spotify and Apple Music links!\");
'"

echo ""
echo "✅ DSP links update complete!"
echo "🔄 Please refresh the Discover page to see the changes"

