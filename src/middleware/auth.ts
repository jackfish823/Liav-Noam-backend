import {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../utils/jwt';

const AUTH_HEADER_PREFIX = "Bearer "

export interface AuthRequest extends Request {
    user?: any;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith(AUTH_HEADER_PREFIX)) {
        res.status(401).json({message: "Invalid or missing authorization token"});
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({message: "Invalid authorization token"});
        return;
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (err) {
        res.status(403).json({message: 'Invalid or expired token'});
    }
};

export default authMiddleware;
