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
exports.default = recharge;
const prisma_1 = require("../../../utils/prisma");
const mercadopago_1 = require("mercadopago");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const date_fns_1 = require("date-fns");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/* ================= ENV ================= */
const JWT_KEY = process.env.JWT_KEY;
const API_KEY = process.env.API_KEY;
const MP_TOKEN = process.env.TOKEN_MP;
if (!JWT_KEY)
    throw new Error("JWT_KEY necessária no .env");
if (!API_KEY)
    throw new Error("API_KEY necessária no .env");
if (!MP_TOKEN)
    throw new Error("TOKEN_MP necessária no .env");
/* ================= MERCADO PAGO ================= */
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: MP_TOKEN });
const payment = new mercadopago_1.Payment(client);
/* ================= CONSTANTES ================= */
const MIN_RECHARGE_VALUE = 1;
const MAX_RECHARGE_VALUE = 1000;
/* ================= CONTROLLER ================= */
function recharge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const apiKey = req.headers["x-api-key"];
        const userToken = req.headers["x-user-token"];
        /* ================= API KEY ================= */
        if (!apiKey || apiKey !== API_KEY) {
            return res.status(403).send({ message: "Acesso negado." });
        }
        /* ================= TOKEN ================= */
        if (!userToken) {
            return res.status(400).send({
                message: "É necessário informar o token no header x-user-token.",
            });
        }
        /* ================= BODY ================= */
        const { rechargeValue } = req.body;
        const value = Number(rechargeValue);
        if (!rechargeValue || isNaN(value)) {
            return res.status(400).send({
                message: "Valor de recarga inválido.",
            });
        }
        /* ================= VALIDAÇÕES ================= */
        if (value < MIN_RECHARGE_VALUE) {
            return res.status(400).send({
                message: "Valor mínimo de recarga: R$1,00",
            });
        }
        if (value > MAX_RECHARGE_VALUE) {
            return res.status(400).send({
                message: "Valor máximo de recarga: R$1000,00",
            });
        }
        try {
            /* ================= JWT ================= */
            const decoded = jsonwebtoken_1.default.verify(userToken, JWT_KEY);
            if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
                return res.status(401).send({ message: "Token inválido." });
            }
            const userId = decoded.id;
            /* ================= USER ================= */
            const user = yield prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).send({ message: "Usuário não encontrado." });
            }
            /* ================= PAGAMENTO PENDENTE ================= */
            const oneMinuteAgo = (0, date_fns_1.subMinutes)(new Date(), 1);
            const pendingOrder = yield prisma_1.prisma.orders.findFirst({
                where: {
                    userId: user.id,
                    typeOrder: "recharge",
                    createdAt: { gte: oneMinuteAgo },
                },
                orderBy: { createdAt: "desc" },
            });
            if (pendingOrder) {
                return res.status(400).send({
                    message: "Você já possui uma recarga pendente.",
                });
            }
            /* ================= MERCADO PAGO ================= */
            const mpResponse = yield payment.create({
                body: {
                    transaction_amount: value, // ✅ NUMBER
                    payment_method_id: "pix",
                    payer: {
                        email: user.email,
                    },
                },
            });
            const pixKey = (_b = (_a = mpResponse === null || mpResponse === void 0 ? void 0 : mpResponse.point_of_interaction) === null || _a === void 0 ? void 0 : _a.transaction_data) === null || _b === void 0 ? void 0 : _b.qr_code;
            if (!pixKey || !mpResponse.id) {
                throw new Error("Erro ao gerar pagamento PIX.");
            }
            /* ================= ORDER ================= */
            yield prisma_1.prisma.orders.create({
                data: {
                    userId: user.id,
                    typeOrder: "recharge",
                    amount: value.toFixed(2), // ✅ STRING NO BANCO
                    desc: String(mpResponse.id), // 🔥 ID DO PAGAMENTO MP
                    pixCopyPasteKey: pixKey
                },
            });
            /* ================= RESPONSE ================= */
            return res.status(200).send({
                message: "Recarga criada com sucesso.",
                pixCopyPasteKey: pixKey,
            });
        }
        catch (err) {
            console.error("Erro na recarga:", err);
            return res.status(500).send({
                message: "Erro ao processar a recarga.",
            });
        }
    });
}
