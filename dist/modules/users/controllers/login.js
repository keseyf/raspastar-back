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
exports.default = login;
const utils_1 = require("../../../utils/utils");
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}
if (!process.env.JWT_KEY) {
    throw new Error("JWT KEY NECESSARIA!");
}
const requestCounts = {};
const MAX_REQUESTS = 3;
const COOLDOWN = 5 * 1000;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validacoes básicas
        const apiKey = req.headers["x-api-key"];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).send({ message: "Acesso negado." });
            return;
        }
        const ip = req.ip;
        const now = Date.now();
        if (!requestCounts[ip]) {
            requestCounts[ip] = { count: 1, lastTime: now };
        }
        else {
            if (now - requestCounts[ip].lastTime > COOLDOWN) {
                requestCounts[ip] = { count: 1, lastTime: now };
            }
            else {
                requestCounts[ip].count += 1;
                if (requestCounts[ip].count > MAX_REQUESTS) {
                    const wait = Math.ceil((COOLDOWN - (now - requestCounts[ip].lastTime)) / 1000);
                    res.status(429).send({ message: `Você está indo rápido demais, tente novamente mais tarde.` });
                    return;
                }
            }
            requestCounts[ip].lastTime = now;
        }
        // Logica principal
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).send({ message: "Campo de Email não preenchido." });
        }
        if (!password) {
            return res.status(400).send({ message: "Campo de senha não preenchido." });
        }
        try {
            const user = yield prisma_1.default.user.findMany({
                where: { email }
            });
            if (!user || user.length === 0 || user == undefined) {
                return res.status(400).send({ message: "Úsuario não encontrado, verifique o campo de email." });
            }
            const samePasswords = yield bcrypt_1.default.compare(password, user[0].password);
            if (!samePasswords) {
                return res.status(400).send({ message: "Senha e usuário não coincidem." });
            }
            const token = utils_1.jwt.sign(user[0], String(process.env.JWT_KEY));
            return res.status(200).send({ message: "Entrando na conta...", token });
        }
        catch (e) {
            console.log(e);
            return res.status(400).send({ message: "Erro inesperado" });
        }
    });
}
