import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../../utils/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";
import jwt, { JwtPayload } from "jsonwebtoken";
import { subMinutes } from "date-fns";
import dotenv from "dotenv";

dotenv.config();

/* ================= ENV ================= */

const JWT_KEY = process.env.JWT_KEY;
const API_KEY = process.env.API_KEY;
const MP_TOKEN = process.env.TOKEN_MP;

if (!JWT_KEY) throw new Error("JWT_KEY necessária no .env");
if (!API_KEY) throw new Error("API_KEY necessária no .env");
if (!MP_TOKEN) throw new Error("TOKEN_MP necessária no .env");

/* ================= MERCADO PAGO ================= */

const client = new MercadoPagoConfig({ accessToken: MP_TOKEN });
const payment = new Payment(client);

/* ================= CONSTANTES ================= */

const MIN_RECHARGE_VALUE = 1;
const MAX_RECHARGE_VALUE = 1000;

/* ================= CONTROLLER ================= */

export default async function recharge(
  req: FastifyRequest,
  res: FastifyReply
) {
  const apiKey = req.headers["x-api-key"];
  const userToken = req.headers["x-user-token"] as string | undefined;

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

  const { rechargeValue } = req.body as {
    rechargeValue: number | string;
  };

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

    const decoded = jwt.verify(userToken, JWT_KEY!) as JwtPayload;

    if (!decoded?.id) {
      return res.status(401).send({ message: "Token inválido." });
    }

    const userId = decoded.id as string;

    /* ================= USER ================= */

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado." });
    }

    /* ================= PAGAMENTO PENDENTE ================= */

    const oneMinuteAgo = subMinutes(new Date(), 1);

    const pendingOrder = await prisma.orders.findFirst({
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

    const mpResponse = await payment.create({
      body: {
        transaction_amount: value, // ✅ NUMBER
        payment_method_id: "pix",
        payer: {
          email: user.email,
        },
      },
    });

    const pixKey =
      mpResponse?.point_of_interaction?.transaction_data?.qr_code;

    if (!pixKey || !mpResponse.id) {
      throw new Error("Erro ao gerar pagamento PIX.");
    }

    /* ================= ORDER ================= */

    await prisma.orders.create({
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
  } catch (err) {
    console.error("Erro na recarga:", err);
    return res.status(500).send({
      message: "Erro ao processar a recarga.",
    });
  }
}
