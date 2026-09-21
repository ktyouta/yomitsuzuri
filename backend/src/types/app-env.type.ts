import type { EnvBindings, EnvConfig } from "../config";
import type { UserId } from "../domain";
import type { Database } from "../infrastructure/db";

export type UserInfoType = {
  id: string;
  name: string;
  birthday: string;
};

export type AuthUserType = {
  userId: UserId;
  info: UserInfoType;
};

export type AppEnv = {
  Bindings: EnvBindings;
  Variables: {
    requestId: string;
    user?: AuthUserType;
    db: Database;
    envConfig: EnvConfig;
  };
};
