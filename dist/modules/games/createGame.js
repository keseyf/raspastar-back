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
exports.default = createGame;
const utils_1 = require("../../utils/utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}
function createGame(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = req.headers["x-api-key"];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).send({ message: "Acesso negado." });
            return;
        }
        try {
            const { name, winTax, imageUrl, desc, gamePrice } = req.body;
            switch (true) {
                case !name: return res.status(400).send({ error: "Nome obrigatório" });
                case !winTax: return res.status(400).send({ error: "Taxa obrigatória" });
                case !imageUrl: return res.status(400).send({ error: "Imagem obrigatória" });
                case !desc: return res.status(400).send({ error: "Descrição obrigatória" });
                case !gamePrice: return res.status(400).send({ error: "Preço obrigatório" });
            }
            const game = yield utils_1.prisma.game.create({
                data: {
                    name, winTax, imageUrl, desc, gamePrice
                }
            }).then((e) => { return res.status(200).send({ message: `Jogo com id (${e.id}) Criado com sucesso!` }); }).catch((e) => { return res.status(400).send({ message: "Erro inesperado ao criar jogo!" }), console.log(e); });
        }
        catch (e) {
            console.error(e);
            res.status(500).send({ message: "Erro interno do servidor." });
        }
    });
}
