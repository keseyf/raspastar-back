"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const games_routes_1 = __importDefault(require("./modules/games/games.routes"));
exports.app = (0, fastify_1.default)();
exports.app.register(cors_1.default, { origin: "*" });
exports.app.register(users_routes_1.default);
exports.app.register(games_routes_1.default);
exports.app.get("/api/v2/games/getAl1l", (req, res) => {
    res.send("Teste");
});
