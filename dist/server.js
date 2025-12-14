"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const games_routes_1 = __importDefault(require("./modules/games/games.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const cors_1 = __importDefault(require("@fastify/cors"));
const utils_1 = require("./utils/utils");
const port = 4444;
utils_1.app.register(cors_1.default, {
    origin: "*"
});
// Users Routes
utils_1.app.register(users_routes_1.default);
utils_1.app.register(games_routes_1.default);
utils_1.app.listen({
    port: port,
}, () => {
    console.log(`[+] Servidor iniciado em http://localhost:${port}`);
});
