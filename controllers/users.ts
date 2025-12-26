import express, { Request, Response } from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Create a new user
router.post('/', async (req: Request, res: Response) => {
    try {
        const { username, email } = req.body;
        const newUser = new User({ username, email });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error: any) {
        res.status(409).json({ message: error.message });
    }
});

// Get all users
router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update user
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { username, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { username, email },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
