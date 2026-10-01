import { chaveDia } from "@/lib/domain/datas";
import { PRIORIDADE, STATUS_EXECUTIVO, STATUS_PROJETO, TIPO_PROJETO } from "@/lib/domain/rotulos";
import { Campo } from "./ui";

type Valores = {
  nome?: string;
  clienteId?: string;
  tipo?: string;
  status?: string;
  prioridade?: string;
  gpId?: string | null;
  dataKickoff?: Date | null;
  dataGoLiveAlvo?: Date | null;
  dataGoLiveReal?: Date | null;
  dataEncerramentoPrevista?: Date | null;
  dataEncerramentoReal?: Date | null;
  horasVendidas?: number | null;
  statusExecutivo?: string | null;
  notas?: string | null;
};

const d = (v?: Date | null) => (v ? chaveDia(v) : "");

/** Campos do cadastro de projeto (usados na criação e na edição). */
export function CamposProjeto({ v = {}, clientes, recursos, gpPadraoId }: { v?: Valores; clientes: { id: string; nome: string }[]; recursos: { id: string; nome: string }[]; gpPadraoId?: string }) {
  const opcoes = (m: Record<string, string>) =>
    Object.entries(m).map(([k, r]) => (
      <option key={k} value={k}>
        {r}
      </option>
    ));
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Campo rotulo="Projeto" className="sm:col-span-2">
        <input name="nome" required defaultValue={v.nome} className="campo" />
      </Campo>
      <Campo rotulo="Cliente">
        <select name="clienteId" required defaultValue={v.clienteId ?? ""} className="campo">
          <option value="" disabled>
            Escolha…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="GP">
        <select name="gpId" defaultValue={v.gpId ?? gpPadraoId ?? ""} className="campo">
          <option value="">— sem GP —</option>
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Tipo">
        <select name="tipo" defaultValue={v.tipo ?? "PROJETO"} className="campo">
          {opcoes(TIPO_PROJETO)}
        </select>
      </Campo>
      <Campo rotulo="Status">
        <select name="status" defaultValue={v.status ?? "EM_ANDAMENTO"} className="campo">
          {opcoes(STATUS_PROJETO)}
        </select>
      </Campo>
      <Campo rotulo="Prioridade">
        <select name="prioridade" defaultValue={v.prioridade ?? "MEDIA"} className="campo">
          {opcoes(PRIORIDADE)}
        </select>
      </Campo>
      <Campo rotulo="Status executivo">
        <select name="statusExecutivo" defaultValue={v.statusExecutivo ?? ""} className="campo">
          <option value="">—</option>
          {opcoes(STATUS_EXECUTIVO)}
        </select>
      </Campo>
      <Campo rotulo="Kick-off">
        <input type="date" name="dataKickoff" defaultValue={d(v.dataKickoff)} className="campo" />
      </Campo>
      <Campo rotulo="Go Live alvo">
        <input type="date" name="dataGoLiveAlvo" defaultValue={d(v.dataGoLiveAlvo)} className="campo" />
      </Campo>
      <Campo rotulo="Encerramento previsto">
        <input type="date" name="dataEncerramentoPrevista" defaultValue={d(v.dataEncerramentoPrevista)} className="campo" />
      </Campo>
      <Campo rotulo="Horas vendidas">
        <input type="number" step="0.5" min="0" name="horasVendidas" defaultValue={v.horasVendidas ?? ""} className="campo" />
      </Campo>
      <Campo rotulo="Go Live real">
        <input type="date" name="dataGoLiveReal" defaultValue={d(v.dataGoLiveReal)} className="campo" />
      </Campo>
      <Campo rotulo="Encerramento real">
        <input type="date" name="dataEncerramentoReal" defaultValue={d(v.dataEncerramentoReal)} className="campo" />
      </Campo>
      <Campo rotulo="Notas · bloqueios · ações" className="sm:col-span-2 lg:col-span-4">
        <textarea name="notas" rows={3} defaultValue={v.notas ?? ""} className="campo" />
      </Campo>
    </div>
  );
}
