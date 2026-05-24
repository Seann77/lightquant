import { ServerConfigError, getDataMode, getDatabaseUrl } from "@/server/env";
import { MockLightQuantRepository } from "@/server/repositories/mock/mock-repository";
import type { LightQuantRepository } from "@/server/repositories/types";

declare global {
  // Development-only singleton so Next dev route recompiles do not erase MVP mock data.
  // Production is guarded from using LIGHTQUANT_DATA_MODE=mock in env.ts.
  var __lightquantMockRepository: LightQuantRepository | undefined;
}

export function getRepository(): LightQuantRepository {
  const mode = getDataMode();

  if (mode === "mock") {
    if (!globalThis.__lightquantMockRepository) {
      globalThis.__lightquantMockRepository = new MockLightQuantRepository();
    }

    return globalThis.__lightquantMockRepository;
  }

  getDatabaseUrl();
  throw new ServerConfigError("Database repository is not implemented in this MVP stage");
}
