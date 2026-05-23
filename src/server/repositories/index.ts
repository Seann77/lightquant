import { ServerConfigError, getDataMode, getDatabaseUrl } from "@/server/env";
import { MockLightQuantRepository } from "@/server/repositories/mock/mock-repository";
import type { LightQuantRepository } from "@/server/repositories/types";

let mockRepository: LightQuantRepository | null = null;

export function getRepository(): LightQuantRepository {
  const mode = getDataMode();

  if (mode === "mock") {
    if (!mockRepository) {
      mockRepository = new MockLightQuantRepository();
    }

    return mockRepository;
  }

  getDatabaseUrl();
  throw new ServerConfigError("Database repository is not implemented in this MVP stage");
}

