import type { D1Migration } from "cloudflare:test";
import type { EnvBindings } from "../src/config";

declare global {
  namespace Cloudflare {
    interface Env extends EnvBindings {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
