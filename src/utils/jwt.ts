import jwt from 'jsonwebtoken';

const DEFAULTS = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    SECRET: 'default_jwt_secret'
};

type AuthTokens = {
    token: string,
    refreshToken: string
};

export const createAuthTokens = (userId: string): AuthTokens => {
    const secret = process.env.JWT_SECRET || DEFAULTS.SECRET;
    const expiresIn = process.env.JWT_EXPIRY_TIME || DEFAULTS.ACCESS_TOKEN_EXPIRY

    // @ts-ignore
    const signedToken = jwt.sign(
        {_id: userId},
        secret,
        {expiresIn}
    );

    const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY_TIME || DEFAULTS.REFRESH_TOKEN_EXPIRY
    const rand = Math.floor(Math.random() * 1000);

    // @ts-ignore
    const refreshToken = jwt.sign(
        {_id: userId, rand},
        secret,
        {expiresIn: refreshExpiry}
    );

    return {token: signedToken, refreshToken};
}

export const verifyToken = (token: string) => {
    const secret = process.env.JWT_SECRET || DEFAULTS.SECRET;
    
    return jwt.verify(token, secret) as { _id: string };
};
