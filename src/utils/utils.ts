import fastify from "fastify";
import jsonwebtoken from "jsonwebtoken"
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient()
export const jwt = jsonwebtoken
