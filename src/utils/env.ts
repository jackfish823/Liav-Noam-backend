import dotenv from "dotenv";

export const loadEnvironmentConfig = () => {
    if (process.env.NODE_ENV === 'test') {
        dotenv.config({ path: ".env.test" });
    } else if (process.env.NODE_ENV === 'production') {
        dotenv.config({ path: ".env" });
    } else {
        dotenv.config({ path: ".env.dev" });
    }
};
