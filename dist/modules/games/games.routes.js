"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = gamesRoutes;
const app_1 = require("../../app");
const getGames_1 = __importDefault(require("./controllers/getGames"));
const createGame_1 = __importDefault(require("./controllers/createGame"));
const getGameById_1 = __importDefault(require("./controllers/getGameById"));
const gambling_1 = __importDefault(require("./controllers/gambling"));
function gamesRoutes() {
    return __awaiter(this, void 0, void 0, function* () {
        // GET
        app_1.app.get("/api/v2/games/getAll", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, getGames_1.default)(req, res);
        }));
        app_1.app.get("/api/v2/games/getById/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, getGameById_1.default)(req, res);
        }));
        // POST
        app_1.app.post("/api/v2/games/create", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, createGame_1.default)(req, res);
        }));
        app_1.app.post("/api/v2/games/gambling", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, gambling_1.default)({ req, res });
        }));
    });
}
