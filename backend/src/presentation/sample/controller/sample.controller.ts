import { Hono } from "hono";
import type { AppEnv } from "../../../types";
import { getListSample } from "./get-list-sample.controller";
import { getSampleById } from "./get-sample.controller";
import { createSample } from "./create-sample.controller";
import { updateSample } from "./update-sample.controller";
import { deleteSample } from "./delete-sample.controller";

// ルーティング（チェーンで型情報を保持）
const sample = new Hono<AppEnv>()
    .route("/", getListSample)
    .route("/", getSampleById)
    .route("/", createSample)
    .route("/", updateSample)
    .route("/", deleteSample);

export { sample };
