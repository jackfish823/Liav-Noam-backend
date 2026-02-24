import initApp from "./index";
import https from "https";
import http from "http";
import fs from "fs";


initApp().then((app) => {
    if (process.env.NODE_ENV !== "production") {
        console.log('development');
        http.createServer(app).listen(process.env.PORT);
    } else {
        console.log('PRODUCTION');
        const options = {
            key: fs.readFileSync("/etc/ssl/private/client-key.pem"),
            cert: fs.readFileSync("/etc/ssl/certs/client-cert.pem"),
        }
        https.createServer(options, app).listen(process.env.HTTPS_PORT);
    }
});