import { Router } from 'express';
import { isSupabaseConfigured } from '../lib/supabase.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'FixIt QR API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      configured: isSupabaseConfigured
    }
  });
});

export default router;
