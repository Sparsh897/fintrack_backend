import { Router, Request, Response } from 'express';
import { SplitBill } from '../models/SplitBill';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected with authentication
router.use(authenticateToken);

/**
 * POST /api/split-bills
 * Create a new split bill
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { totalAmount, description, participants } = req.body;

    // Validation
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: 'Total amount must be greater than 0'
      });
    }

    if (!participants || participants.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: 'At least 2 participants are required'
      });
    }

    // Validate sum of participant amounts equals total (with tolerance for rounding)
    const participantsSum = participants.reduce((sum: number, p: any) => sum + p.amount, 0);
    const tolerance = 0.01;
    if (Math.abs(participantsSum - totalAmount) > tolerance) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: 'Sum of participant amounts must equal total amount'
      });
    }

    // Auto-mark first participant (creator) as paid
    const processedParticipants = participants.map((p: any, index: number) => ({
      ...p,
      status: index === 0 ? 'paid' : 'pending'
    }));

    const splitBill = new SplitBill({
      userId: req.user!.userId,
      totalAmount,
      description,
      participants: processedParticipants
    });

    await splitBill.save();
    res.status(201).json(splitBill);
  } catch (error: any) {
    console.error('Create split bill error:', error);
    res.status(400).json({ 
      error: 'Failed to create split bill',
      details: error.message 
    });
  }
});

/**
 * GET /api/split-bills
 * Get all split bills for authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', page = '1' } = req.query;
    
    const query: any = { userId: req.user!.userId };
    
    // Filter by status if provided
    if (status && ['pending', 'completed', 'cancelled'].includes(status as string)) {
      query.status = status;
    }

    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const splitBills = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    res.json(splitBills);
  } catch (error: any) {
    console.error('Get split bills error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch split bills',
      message: error.message 
    });
  }
});

/**
 * GET /api/split-bills/:id
 * Get a specific split bill by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const splitBill = await SplitBill.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    });

    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    res.json(splitBill);
  } catch (error: any) {
    console.error('Get split bill error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch split bill',
      message: error.message 
    });
  }
});

/**
 * PUT /api/split-bills/:id
 * Update the overall status of a split bill
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: 'Status must be one of: pending, completed, cancelled'
      });
    }

    const splitBill = await SplitBill.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    });

    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    splitBill.status = status;
    await splitBill.save();

    res.json(splitBill);
  } catch (error: any) {
    console.error('Update split bill error:', error);
    res.status(400).json({ 
      error: 'Failed to update split bill',
      message: error.message 
    });
  }
});

/**
 * PUT /api/split-bills/:id/participants/:phone
 * Update payment status of a specific participant
 */
router.put('/:id/participants/:phone', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id, phone } = req.params;

    if (!status || !['pending', 'paid'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: 'Status must be one of: pending, paid'
      });
    }

    const splitBill = await SplitBill.findOne({
      _id: id,
      userId: req.user!.userId
    });

    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    // Find and update the participant
    const participant = splitBill.participants.find(p => p.phone === phone);
    
    if (!participant) {
      return res.status(404).json({ 
        error: 'Participant not found',
        details: `No participant found with phone: ${phone}`
      });
    }

    participant.status = status;
    
    // Save will trigger the pre-save middleware to auto-complete if all paid
    await splitBill.save();

    res.json(splitBill);
  } catch (error: any) {
    console.error('Update participant error:', error);
    res.status(400).json({ 
      error: 'Failed to update participant status',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/split-bills/:id
 * Delete a split bill
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const splitBill = await SplitBill.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.userId
    });

    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    res.json({ message: 'Split bill deleted successfully' });
  } catch (error: any) {
    console.error('Delete split bill error:', error);
    res.status(500).json({ 
      error: 'Failed to delete split bill',
      message: error.message 
    });
  }
});

export default router;
