import express from 'express';
import Artist from '../models/artist.js';

const router = express.Router();

// Get all artists
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find();
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single artist
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create artist
router.post('/', async (req, res) => {
  const artist = new Artist({
    name: req.body.name,
    imageUrl: req.body.imageUrl,
    socialMedia: req.body.socialMedia || {}
  });

  try {
    const newArtist = await artist.save();
    res.status(201).json(newArtist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update artist
router.patch('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    if (req.body.name) artist.name = req.body.name;
    if (req.body.imageUrl) artist.imageUrl = req.body.imageUrl;
    if (req.body.socialMedia) {
      artist.socialMedia = { ...artist.socialMedia, ...req.body.socialMedia };
    }

    const updatedArtist = await artist.save();
    res.json(updatedArtist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete artist
router.delete('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    await artist.deleteOne();
    res.json({ message: 'Artist deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;
