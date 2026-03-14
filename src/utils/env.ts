import dotenv from "dotenv";

export const loadEnvironmentConfig = () => {
    if (process.env.NODE_ENV === 'test') {
        dotenv.config({ path: ".env.test" });
    } else if (process.env.NODE_ENV === 'dev') {
        dotenv.config({ path: ".env.dev" });
    } else {
        dotenv.config({ path: ".env" });
    }
};
