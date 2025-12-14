import gamesRoutes from "./modules/games/games.routes"
import getUsers from "./modules/users/controllers/getUsers"
import userRoutes from "./modules/users/users.routes"
import fastifyCors from "@fastify/cors"
import { app } from "./utils/utils"

const port = 4444
app.register(fastifyCors, {
    origin: "*"
});

// Users Routes
app.register(userRoutes)
app.register(gamesRoutes)

app.listen({
    port: port,
}, ()=>{
    console.log(`[+] Servidor iniciado em http://localhost:${port}`)
})