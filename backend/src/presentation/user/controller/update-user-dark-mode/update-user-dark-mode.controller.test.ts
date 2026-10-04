import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { createEnvConfig } from "../../../../config";
import { AccessToken } from "../../../../domain/auth";
import { UserId } from "../../../../domain/shared";
import { userMaster } from "../../../../infrastructure/db";
import * as schema from "../../../../infrastructure/db/schema";

describe("PATCH /api/v1/user/dark-mode", () => {

    it("認証済みユーザー本人のみが更新され、他ユーザーには影響しないこと（IDOR対策）", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const authenticatedUserId = ulid();
        const otherUserId = ulid();

        await db.insert(userMaster).values([
            { id: authenticatedUserId, name: `test-user-${authenticatedUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
            { id: otherUserId, name: `test-user-${otherUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
        ]);

        const config = createEnvConfig(env);
        const accessToken = await AccessToken.create(UserId.of(authenticatedUserId), config);

        const res = await SELF.fetch("http://localhost/api/v1/user/dark-mode", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify({ darkMode: true }),
        });

        expect(res.status).toBe(200);

        const [authenticatedUserRow] = await db.select().from(userMaster).where(eq(userMaster.id, authenticatedUserId));
        const [otherUserRow] = await db.select().from(userMaster).where(eq(userMaster.id, otherUserId));

        expect(authenticatedUserRow.darkMode).toBe(true);
        expect(otherUserRow.darkMode).toBe(false);
    });
});
