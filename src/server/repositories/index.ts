import { AsyncLocalStorage } from "async_hooks";
import { getDataMode } from "@/server/env";
import { DatabaseLightQuantRepository } from "@/server/repositories/database/database-repository";
import { MockLightQuantRepository } from "@/server/repositories/mock/mock-repository";
import type { LightQuantRepository } from "@/server/repositories/types";

declare global {
  // Development-only singleton so Next dev route recompiles do not erase MVP mock data.
  // Production is guarded from using LIGHTQUANT_DATA_MODE=mock in env.ts.
  var __lightquantMockRepository: LightQuantRepository | undefined;
  var __lightquantDatabaseRepository: DatabaseLightQuantRepository | undefined;
}

const repositoryContext = new AsyncLocalStorage<LightQuantRepository>();

export function getRepository(): LightQuantRepository {
  const scopedRepository = repositoryContext.getStore();

  if (scopedRepository) {
    return scopedRepository;
  }

  const mode = getDataMode();

  if (mode === "mock") {
    if (!globalThis.__lightquantMockRepository || !isRepositoryShapeCurrent(globalThis.__lightquantMockRepository)) {
      globalThis.__lightquantMockRepository = new MockLightQuantRepository();
    }

    return globalThis.__lightquantMockRepository;
  }

  if (!globalThis.__lightquantDatabaseRepository || !isRepositoryShapeCurrent(globalThis.__lightquantDatabaseRepository)) {
    globalThis.__lightquantDatabaseRepository = new DatabaseLightQuantRepository();
  }

  return globalThis.__lightquantDatabaseRepository;
}

export async function withRepositoryTransaction<T>(callback: () => Promise<T>) {
  const repository = getRepository();

  if (repository instanceof DatabaseLightQuantRepository) {
    return repository.withTransaction((transactionRepository) => repositoryContext.run(transactionRepository, callback));
  }

  return repositoryContext.run(repository, callback);
}

function isRepositoryShapeCurrent(repository: LightQuantRepository) {
  return (
    typeof repository.listLatestAiTasksForConversations === "function" &&
    typeof repository.listUploadedFilesByIds === "function"
  );
}
