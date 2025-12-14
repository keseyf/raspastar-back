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
exports.default = getUserData;
const utils_1 = require("../../../utils/utils");
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const JWT_KEY = process.env.JWT_KEY;
const API_KEY = process.env.API_KEY;
if (!JWT_KEY) {
    throw new Error("JWT_KEY necessária no arquivo .env!");
}
if (!API_KEY) {
    throw new Error("API_KEY necessária no arquivo .env!");
}
function getUserData(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = req.headers["x-api-key"];
        const userToken = req.headers["x-user-token"];
        if (!apiKey || apiKey !== API_KEY) {
            return res.status(403).send({ message: "Acesso negado." });
        }
        if (!userToken) {
            return res
                .status(400)
                .send({ message: "É necessário informar o token de usuário no header `x-user-token`." });
        }
        try {
            // ✅ Garantimos que JWT_KEY é string com "!"
            const decoded = jsonwebtoken_1.default.verify(userToken, JWT_KEY);
            // ✅ Verifica se é JwtPayload antes de acessar .id
            if (typeof decoded !== "object" || !("id" in decoded)) {
                return res.status(401).send({ message: "Token inválido." });
            }
            const userId = decoded.id;
            const usrdata = yield utils_1.prisma.user.findFirst({ where: { id: userId } });
            if (!usrdata) {
                return res.status(404).send({ message: "Usuário não encontrado." });
            }
            return res.status(200).send({ message: "Usuario encontrado com sucesso!", usrdata });
        }
        catch (e) {
            console.error(e);
            return res.status(401).send({ message: "Token inválido ou expirado." });
        }
    });
}
