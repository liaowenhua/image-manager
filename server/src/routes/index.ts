import { Router } from 'express';
import photosRouter from './photos.js';
import searchRouter from './search.js';

const router = Router();

router.use('/photos', photosRouter);
router.use('/search', searchRouter);

// Placeholder routes
router.get('/albums', (req, res) => {
  res.json({ message: 'Albums endpoint - to be implemented' });
});

router.get('/tags', (req, res) => {
  res.json({ message: 'Tags endpoint - to be implemented' });
});

export default router;