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
exports.default = getUsers;
const prisma_1 = require("../../../utils/prisma");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.API_KEY) {
    throw new Error("API KEY NECESSARIA!");
}
function getUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== process.env.API_KEY || !apiKey) {
            res.send("Acesso negado.");
            return;
        }
        try {
            const users = yield prisma_1.prisma.user.findMany();
            if (!users) {
                res.send("Nenhum usuario encontrado.");
                return;
            }
            res.send({ "users": users });
            return;
        }
        catch (e) {
            console.log(e);
            res.status(404).send("Não foi possivel realizar a requisição ao banco de dados.");
            return;
        }
    });
}
