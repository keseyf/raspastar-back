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
exports.default = userRoutes;
const app_1 = require("../../app");
const createUser_1 = __importDefault(require("./controllers/createUser"));
const getUsers_1 = __importDefault(require("./controllers/getUsers"));
const login_1 = __importDefault(require("./controllers/login"));
const getUserData_1 = __importDefault(require("./controllers/getUserData"));
function userRoutes() {
    return __awaiter(this, void 0, void 0, function* () {
        // GET
        app_1.app.get("/api/v2/users", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, getUsers_1.default)(req, res);
        }));
        app_1.app.get("/api/v2/users/profile/", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, getUserData_1.default)(req, res);
        }));
        // POST
        app_1.app.post("/api/v2/users/create/", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, createUser_1.default)(req, res);
        }));
        app_1.app.post("/api/v2/users/login", (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield (0, login_1.default)(req, res);
        }));
    });
}
