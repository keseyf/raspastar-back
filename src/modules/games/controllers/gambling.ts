import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../../utils/utils";
import { game1Prizes, game2Prizes, game3Prizes, game4Prizes } from "../../../utils/prizes";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.API_KEY) {
  throw new Error("API KEY NECESSÁRIA!");
}

export default async function gambling({ req, res }: { req: FastifyRequest, res: FastifyReply }) {
  const gameId = Number(req.headers["x-game-id"]);
  const userId = String(req.headers["x-user-id"]);
  const apiKey = req.headers["x-api-key"];
  let winChanceTax: number;
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).send({ message: `Acesso negado. ${apiKey}` });
    return;
  }

  try {
    if (!gameId) return res.status(400).send({ message: "Game id não definido" });
    if (!userId) return res.status(400).send({ message: "User id não definido" });

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) return res.status(400).send({ message: "Jogo não encontrado/disponível" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(400).send({ message: "Usuário não encontrado" });

    let prizes: { id: string, winChance: number, imgUrl: string }[] = [];
    let gamePrice = 0;

    // Definir prêmios e preços de acordo com o jogo
    switch (game.id) {
      case 1:
        prizes = game1Prizes;
        gamePrice = game.gamePrice; // Deve ser 10 aqui
        winChanceTax = 0.075;
        break;
      case 2:
        prizes = game2Prizes;
        gamePrice = game.gamePrice; // Deve ser 5 aqui
        winChanceTax = 0.08;
        break;
      case 3:
        prizes = game3Prizes;
        gamePrice = game.gamePrice; // Deve ser 2 aqui
        winChanceTax = 0.13;
        break;
      case 4:
        prizes = game4Prizes;
        gamePrice = game.gamePrice; // Deve ser 1 aqui
        winChanceTax = 0.15;
        break;
      default:
        return res.status(400).send({ message: "Jogo inválido" });
    }

    if (user.balance < gamePrice) {
      return res.status(400).send({ message: "Saldo insuficiente para jogar" });
    }

    // Desconta o valor do jogo
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: gamePrice } }
    });

    const userBalance = user.balance;

    // Função para calcular chance de ganhar PIX com base no saldo
    function calculatePixChance(balance: number, prizeValue: number): number {
      if (balance <= 20) {
        // Aumento mais suave (20% em vez de 40%)
        return 1 + 0.20;  // Aumento de 20% nas chances
      }
      return 1;
    }

    // Função para gerar board com chances de ganhar baseadas em winChance
    function generateBoardWithChances(prizes: { id: string, winChance: number, imgUrl: string }[], count: number, ganhou: boolean, balance: number): string[] {
      const board: string[] = [];
      const totalChance = prizes.reduce((sum, prize) => sum + prize.winChance, 0);

      if (ganhou) {
        const randomPrizeIndex = Math.floor(Math.random() * prizes.length);
        const winningPrize = prizes[randomPrizeIndex].id;

        // Coloca 3 prêmios iguais no board
        for (let i = 0; i < 3; i++) {
          board.push(winningPrize);
        }

        while (board.length < count) {
          const roll = Math.random() * totalChance;
          let cumulativeChance = 0;
          let selectedPrize = "";

          for (const prize of prizes) {
            if (prize.id.startsWith("PIX R$")) {
              const prizeValue = parseFloat(prize.id.replace("PIX R$", "").replace(",", "."));
              const pixChanceFactor = calculatePixChance(balance, prizeValue);
              cumulativeChance += prize.winChance * pixChanceFactor;
            } else {
              cumulativeChance += prize.winChance;
            }

            if (roll <= cumulativeChance) {
              selectedPrize = prize.id;
              break;
            }
          }

          if (!board.includes(selectedPrize)) {
            board.push(selectedPrize);
          }
        }
      } else {
        while (board.length < count) {
          const roll = Math.random() * totalChance;
          let cumulativeChance = 0;
          let selectedPrize = "";

          for (const prize of prizes) {
            if (prize.id.startsWith("PIX R$")) {
              const prizeValue = parseFloat(prize.id.replace("PIX R$", "").replace(",", "."));
              const pixChanceFactor = calculatePixChance(balance, prizeValue);
              cumulativeChance += prize.winChance * pixChanceFactor;
            } else {
              cumulativeChance += prize.winChance;
            }

            if (roll <= cumulativeChance) {
              selectedPrize = prize.id;
              break;
            }
          }

          let prizeCount = board.filter(prize => prize === selectedPrize).length;

          if (prizeCount < 2) {
            board.push(selectedPrize);
          } else {
            continue;
          }
        }
      }

      if (!board.includes("")) {
        const randomPos = Math.floor(Math.random() * count);
        board[randomPos] = "";
      }

      return board;
    }

    let chanceToWinGame = Math.random();

    // Modificando o fator de multiplicação para um valor mais moderado
    if (userBalance <= 20) {
      chanceToWinGame *= 1.20;  // Aumento mais suave
    }

    const ganhou = chanceToWinGame <= winChanceTax;

    const board = generateBoardWithChances(prizes, 9, ganhou, user.balance);

    if (ganhou) {
      const counts: Record<string, number> = {};
      board.forEach(prize => {
        if (prize !== "") {
          counts[prize] = (counts[prize] || 0) + 1;
        }
      });

      const winningPrize = Object.entries(counts).find(([_, count]) => count === 3);

      if (winningPrize) {
        const prizeName = winningPrize[0];

        // Verifica se o prêmio é em dinheiro
        const isCashPrize = prizeName.startsWith("PIX R$");

        if (isCashPrize) {
          // Se for PIX, adiciona no saldo
          const match = prizeName.match(/PIX R\$(\d+(\.\d{1,2})?)/);
          let prizeValue = 0;
          if (match && match[1]) {
            prizeValue = parseFloat(match[1].replace(",", "."));
          }

          if (prizeValue > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: { balance: { increment: prizeValue } }
            });
          }
        }

        return res.status(200).send({
          message: "Parabéns! Você ganhou!",
          prize: prizeName,
          isCashPrize: isCashPrize, // Retorna se o prêmio é em dinheiro ou não
          board,
          won: true
        });
      }
    }

    return res.status(200).send({
      message: "Não foi dessa vez, tente novamente.",
      board,
      won: false
    });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ message: "Erro inesperado" });
  }
}
