import type { EnvBindings } from "../src/config";

declare module "cloudflare:test" {
  interface ProvidedEnv extends EnvBindings {
    TEST_MIGRATIONS: D1Migration[];
  }
}
