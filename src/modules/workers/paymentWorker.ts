import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { subMinutes } from "date-fns";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const MPToken = process.env.TOKEN_MP;

if (!MPToken) {
  throw new Error("TOKEN_MP não definida no .env");
}

/* ================= MERCADO PAGO ================= */

const client = new MercadoPagoConfig({ accessToken: MPToken });
const payment = new Payment(client);

/* ================= CHECK PAYMENTS ================= */

async function checkPayments() {
  const pendingOrders = await prisma.orders.findMany({
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

      if (!paymentId) continue;

      const mpPayment = await payment.get({
        id: paymentId,
      });

      if (mpPayment?.status === "approved") {
        const value = parseFloat(order.amount.replace(",", "."));

        if (isNaN(value)) continue;

        // 💰 Credita saldo
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            balance: {
              increment: value,
            },
          },
        });

        console.log(
          `✅ Recarga aprovada | ${order.user.email} | R$ ${value}`
        );
      }
    } catch (err) {
      console.error(`❌ Erro no pagamento ${order.desc}:`, err);
    }
  }
}

/* ================= EXPIRE OLD PAYMENTS ================= */

async function expireOldPayments() {
  const limitDate = subMinutes(new Date(), 20);

  const oldOrders = await prisma.orders.deleteMany({
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
}

/* ================= LOOP ================= */

setInterval(async () => {
  await checkPayments();
  await expireOldPayments();
}, 5000);

console.log("🚀 Worker de pagamentos iniciado com sucesso!");
