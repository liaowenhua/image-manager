import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented in subsequent tasks
router.get('/photos', (req, res) => {
  res.json({ message: 'Photos endpoint - to be implemented' });
});

router.get('/albums', (req, res) => {
  res.json({ message: 'Albums endpoint - to be implemented' });
});

router.get('/tags', (req, res) => {
  res.json({ message: 'Tags endpoint - to be implemented' });
});

router.get('/search', (req, res) => {
  res.json({ message: 'Search endpoint - to be implemented' });
});

export default router;