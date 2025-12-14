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
exports.default = getGameById;
const utils_1 = require("../../../utils/utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSÁRIA!");
}
function getGameById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apiKey = req.headers["x-api-key"];
            if (!apiKey || apiKey !== process.env.API_KEY) {
                return res.status(401).send({ message: "Acesso negado." });
            }
            const { id } = req.params;
            const gameId = Number(id);
            if (!id || isNaN(gameId) || !Number.isInteger(gameId)) {
                return res
                    .status(400)
                    .send({ message: "Parâmetro 'id' inválido ou ausente." });
            }
            const game = yield utils_1.prisma.game.findUnique({
                where: { id: gameId },
            });
            if (!game) {
                return res
                    .status(404)
                    .send({ message: "Nenhum jogo encontrado com o ID fornecido." });
            }
            return res.status(200).send({ message: "Sucesso ao capturar informacoes", gameInfo: game });
        }
        catch (error) {
            console.error("Erro em getGameById:", error);
            return res.status(500).send({ message: "Erro interno do servidor." });
        }
    });
}
