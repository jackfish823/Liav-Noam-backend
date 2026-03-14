import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/User';
import Image from '../models/Image';
import {createAuthTokens} from '../utils/jwt';
import { abortTransactionSafely, commitTransactionSafely, startTransactionSafely } from '../utils/transaction';

const attachProfileImageUrl = (user: any) => {
    const baseUrl = process.env.BASE_URL || '/api';
    
    if (user.profileImage && user.profileImage._id) {
        user.profileImage.url = `${baseUrl}/image/${user.profileImage._id}`;
    }
    
    return user;
};

const createUser = async (req: Request, res: Response) => {
    const {username, email, password} = req.body;

    if (!username || !password || !email) {
        res.status(400).json({message: "One or more of the following credentials were not provided: email, password, username"});
        return;
    }

    const session = await mongoose.startSession();

    startTransactionSafely(session);

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [savedUser] = await User.create([{
            username,
            email,
            password: hashedPassword
        }], { session });

        if (req.file) {
            const imageData = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                uploadedBy: savedUser._id,
            };

            const [image] = await Image.create([imageData], { session });

            savedUser.profileImage = image._id;
            
            await savedUser.save({ session });
        }

        const tokens = createAuthTokens(savedUser._id.toString());

        savedUser.refreshTokens.push(tokens.refreshToken);

        await savedUser.save({ session });

        await commitTransactionSafely(session);

        const userWithImage = await User.findById(savedUser._id);

        res.status(201).json(attachProfileImageUrl(userWithImage?.toObject()));
    } catch (error: any) {
        await abortTransactionSafely(session);

        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        res.status(409).json({message: error.message});
    } finally {
        session.endSession();
    }
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        const usersWithImages = users.map(user => attachProfileImageUrl(user.toObject()));
        
        res.status(200).json(usersWithImages);
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json(attachProfileImageUrl(user.toObject()));
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const updateUser = async (req: Request, res: Response) => {
    try {
        const {username, email, profileImage} = req.body;
        const updateData: any = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;

        if ('profileImage' in req.body) {
            if (profileImage) {
                updateData.profileImage = profileImage;
            } else {
                updateData.profileImage = null;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {new: true}
        );

        if (!updatedUser) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json(attachProfileImageUrl(updatedUser.toObject()));
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const deleteUser = async (req: Request, res: Response) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json({message: 'User deleted successfully'});
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

export default {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};
