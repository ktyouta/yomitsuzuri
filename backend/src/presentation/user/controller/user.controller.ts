import { Hono } from "hono";
import type { AppEnv } from "../../../types";
import { createUser } from "./create-user.controller";
import { updateUser } from "./update-user.controller";
import { updateUserDarkMode } from "./update-user-dark-mode.controller";
import { deleteUser } from "./delete-user.controller";

const user = new Hono<AppEnv>()
    .route("/", createUser)
    .route("/", updateUser)
    .route("/", updateUserDarkMode)
    .route("/", deleteUser);

export { user };
