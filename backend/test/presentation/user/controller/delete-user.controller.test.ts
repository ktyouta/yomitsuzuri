import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { createEnvConfig } from "../../../../src/config";
import { AccessToken } from "../../../../src/domain/auth";
import { UserId } from "../../../../src/domain/user";
import { userMaster } from "../../../../src/infrastructure/db";
import * as schema from "../../../../src/infrastructure/db/schema";

describe("DELETE /api/v1/user", () => {

    it("認証済みユーザー本人のみが削除され、他ユーザーには影響しないこと（IDOR対策）", async () => {
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

        const res = await SELF.fetch("http://localhost/api/v1/user", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
            },
        });

        expect(res.status).toBe(204);

        const [authenticatedUserRow] = await db.select().from(userMaster).where(eq(userMaster.id, authenticatedUserId));
        const [otherUserRow] = await db.select().from(userMaster).where(eq(userMaster.id, otherUserId));

        expect(authenticatedUserRow.deleteFlg).toBe(true);
        expect(otherUserRow.deleteFlg).toBe(false);
    });
});
