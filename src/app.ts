import fastify from "fastify"
import fastifyCors from "@fastify/cors"
import userRoutes from "./modules/users/users.routes"
import gamesRoutes from "./modules/games/games.routes"

export const app = fastify()

app.register(fastifyCors, { origin: "*" })

app.register(userRoutes)
app.register(gamesRoutes)

app.get("/api/v2/games/getAl1l", (req,res)=>{
    res.send("Teste")
})