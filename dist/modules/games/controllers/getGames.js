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
exports.default = getGames;
const utils_1 = require("../../../utils/utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}
const requestCounts = {};
const MAX_REQUESTS = 3;
const COOLDOWN = 5 * 1000;
function getGames(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = req.headers["x-api-key"];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).send({ message: "Acesso negado." });
            return;
        }
        try {
            const games = yield utils_1.prisma.game.findMany();
            if (games.length === 0) {
                return res.status(404).send({ message: "Nenhum jogo encontrado." });
            }
            else {
                return res.status(200).send({ message: "Sucesso", games: games });
            }
        }
        catch (e) {
            console.log(e);
            res.status(400).send({ message: "Erro inesperado." });
        }
    });
}
