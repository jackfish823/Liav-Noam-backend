import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';
import {createAuthTokens, verifyToken} from '../utils/jwt';

const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    if (!email || !password) {
        res.status(400).json({message: "One or more of the required credentials are missing"});

        return;
    }

    try {
        const user = await User.findOne({email});

        if (!user) {
            res.status(400).json({message: "Invalid credentials"});

            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(400).json({message: "Invalid credentials"});

            return;
        }

        const tokens = createAuthTokens(user._id.toString());

        user.refreshTokens.push(tokens.refreshToken);

        await user.save();

        res.status(200).json({
            ...tokens,
            _id: user._id
        });
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
};

const validateUserRefreshToken = async (refreshToken: string | undefined): Promise<IUser> => {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded._id);

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.refreshTokens.includes(refreshToken)) {
        user.refreshTokens = [];
        await user.save();
        
        throw new Error("Invalid refresh token");
    }

    return user;
};

const logout = async (req: Request, res: Response) => {
    const {refreshToken} = req.body;

    try {
        const user = await validateUserRefreshToken(refreshToken);

        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
        
        await user.save();

        res.status(200).json({message: "Logged out successfully"});
    } catch (error: any) {
        res.status(403).json({message: error.message || "Invalid request"});
    }
};

const refresh = async (req: Request, res: Response) => {
    const {refreshToken} = req.body;

    try {
        const user = await validateUserRefreshToken(refreshToken);

        const newTokens = createAuthTokens(user._id.toString());

        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
        user.refreshTokens.push(newTokens.refreshToken);

        await user.save();

        res.status(200).json({
            ...newTokens,
            _id: user._id
        });
    } catch (error: any) {
        res.status(403).json({message: error.message});
    }
};

export default {
    login,
    logout,
    refresh
};
