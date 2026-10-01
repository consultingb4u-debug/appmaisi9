import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Armazenamento de arquivos em disco (volume no Docker). Trocar por S3/Azure Blob
// depois significa reimplementar só estas duas funções.
// `turbopackIgnore`: caminho dinâmico em tempo de execução; não deve entrar no rastreamento do build.
const RAIZ = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "./storage");

export async function salvarArquivo(pasta: string, nomeOriginal: string, conteudo: Buffer): Promise<string> {
  const ext = path.extname(nomeOriginal).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const chave = path.posix.join(pasta, `${randomUUID()}${ext}`);
  await mkdir(path.join(/*turbopackIgnore: true*/ RAIZ, pasta), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ RAIZ, chave), conteudo);
  return chave;
}

export async function lerArquivo(chave: string): Promise<Buffer> {
  const destino = path.resolve(/*turbopackIgnore: true*/ RAIZ, chave);
  if (!destino.startsWith(RAIZ + path.sep)) throw new Error("Chave de arquivo inválida.");
  return readFile(/*turbopackIgnore: true*/ destino);
}
