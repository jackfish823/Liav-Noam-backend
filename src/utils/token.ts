import jwt from 'jsonwebtoken';

const DEFAULT_ACCESS_TOKEN_EXPIRY = '15m'
const DEFAULT_REFRESH_TOKEN_EXPIRY = '7d'
const DEFAULT_SECRET = 'default_jwt_secret'

type AuthTokens = {
    token: string,
    refreshToken: string
};

export const createAuthTokens = (userId: string): AuthTokens => {
    const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
    const expiresIn = process.env.JWT_EXPIRY_TIME || DEFAULT_ACCESS_TOKEN_EXPIRY

    // @ts-ignore
    const signedToken = jwt.sign(
        {_id: userId},
        secret,
        {expiresIn}
    );

    const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY_TIME || DEFAULT_REFRESH_TOKEN_EXPIRY
    const rand = Math.floor(Math.random() * 1000);

    // @ts-ignore
    const refreshToken = jwt.sign(
        {_id: userId, rand},
        secret,
        {expiresIn: refreshExpiry}
    );

    return {token: signedToken, refreshToken};
}

