export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { assertApiDocumentKnowledgeBaseReady } = await import("@/server/ai/api-document-retrieval");
  await assertApiDocumentKnowledgeBaseReady();
}
