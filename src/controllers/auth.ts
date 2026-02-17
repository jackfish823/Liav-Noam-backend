import {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
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
            res.status(401).json({message: "Invalid credentials"});

            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401).json({message: "Invalid credentials"});

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

const validateUserRefreshToken = async (refreshToken: string): Promise<IUser> => {
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

    if (!refreshToken) {
        res.status(400).json({message: "Refresh token is required"});
        return;
    }

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

    if (!refreshToken) {
        res.status(400).json({message: "Refresh token is required"});
        return;
    }

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
        res.status(403).json({message: error.message || "Invalid request"});
    }
};

const googleAuth = async (req: Request, res: Response) => {
    const {credential} = req.body;

    if (!credential) {
        res.status(400).json({message: "Google credential is required"});
        return;
    }

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${credential}`
            }
        });

        if (!response.ok) {
            res.status(401).json({message: "Invalid Google credential"});
            return;
        }

        const googleUser = await response.json();

        if (!googleUser.email_verified) {
            res.status(403).json({message: "Google email not verified"});
            return;
        }

        let user = await User.findOne({email: googleUser.email});

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = new User({
                username: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                password: hashedPassword,
            });

            await user.save();
        }

        const tokens = createAuthTokens(user._id.toString());

        user.refreshTokens.push(tokens.refreshToken);

        await user.save();

        res.status(200).json({
            ...tokens,
            _id: user._id
        });
    } catch (error: any) {
        console.error("Google OAuth error:", error);
        res.status(500).json({message: "Failed to authenticate with Google"});
    }
};

export default {
    login,
    logout,
    refresh,
    googleAuth
};
