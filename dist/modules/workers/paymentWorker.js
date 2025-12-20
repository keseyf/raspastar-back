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
const client_1 = require("@prisma/client");
const mercadopago_1 = require("mercadopago");
const date_fns_1 = require("date-fns");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const MPToken = process.env.TOKEN_MP;
if (!MPToken) {
    throw new Error("TOKEN_MP não definida no .env");
}
/* ================= MERCADO PAGO ================= */
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: MPToken });
const payment = new mercadopago_1.Payment(client);
/* ================= CHECK PAYMENTS ================= */
function checkPayments() {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingOrders = yield prisma.orders.findMany({
            where: {
                typeOrder: "recharge",
            },
            include: {
                user: true,
            },
        });
        for (const order of pendingOrders) {
            try {
                const paymentId = order.desc; // ✅ ID DO MP
                if (!paymentId)
                    continue;
                const mpPayment = yield payment.get({
                    id: paymentId,
                });
                if ((mpPayment === null || mpPayment === void 0 ? void 0 : mpPayment.status) === "approved") {
                    const value = parseFloat(order.amount.replace(",", "."));
                    if (isNaN(value))
                        continue;
                    // 💰 Credita saldo
                    yield prisma.user.update({
                        where: { id: order.userId },
                        data: {
                            balance: {
                                increment: value,
                            },
                        },
                    });
                    console.log(`✅ Recarga aprovada | ${order.user.email} | R$ ${value}`);
                }
            }
            catch (err) {
                console.error(`❌ Erro no pagamento ${order.desc}:`, err);
            }
        }
    });
}
/* ================= EXPIRE OLD PAYMENTS ================= */
function expireOldPayments() {
    return __awaiter(this, void 0, void 0, function* () {
        const limitDate = (0, date_fns_1.subMinutes)(new Date(), 20);
        const oldOrders = yield prisma.orders.deleteMany({
            where: {
                typeOrder: "recharge",
                createdAt: {
                    lt: limitDate,
                },
            },
        });
        if (oldOrders.count > 0) {
            console.log(`⏳ ${oldOrders.count} recargas expiradas removidas.`);
        }
    });
}
/* ================= LOOP ================= */
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    yield checkPayments();
    yield expireOldPayments();
}), 5000);
console.log("🚀 Worker de pagamentos iniciado com sucesso!");
