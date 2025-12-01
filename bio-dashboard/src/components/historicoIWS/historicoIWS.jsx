import React, { useState, useMemo } from "react";
import { 
  Ship, 
  FileText, 
  Microscope, 
  Anchor,
  Droplet,
  Search, 
  Filter
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`font-semibold leading-none tracking-tight text-slate-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-slate-100 text-slate-800 border border-slate-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

function ResumoCards({ kpis }) {
  const tipoMaisComum = kpis?.tipo_incrustacao_mais_comum || "N/A";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Navios Monitorados</CardTitle>
          <Ship className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis?.total_navios || 0}</div>
          <p className="text-xs text-slate-500">Base total Transpetro</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inspeções Realizadas</CardTitle>
          <FileText className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis?.total_inspecoes_iws || 0}</div>
          <p className="text-xs text-slate-500">Relatórios de mergulho processados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incrustação Comum</CardTitle>
          <Microscope className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize truncate" title={tipoMaisComum}>
            {tipoMaisComum}
          </div>
          <p className="text-xs text-slate-500">Predominância na frota</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TabelaNaviosResumo({ dados }) {
  const [filtroClasse, setFiltroClasse] = useState("todos");
  const [busca, setBusca] = useState("");

  const classes = useMemo(() => {
    const set = new Set();
    dados.forEach((d) => { if (d.Classe) set.add(d.Classe); });
    return Array.from(set);
  }, [dados]);

  const filtrados = useMemo(() => {
    return dados.filter((d) => {
      const matchClasse = filtroClasse === "todos" || d.Classe === filtroClasse;
      const matchNome = d["Nome do navio"]?.toLowerCase().includes(busca.toLowerCase());
      return matchClasse && matchNome;
    });
  }, [dados, filtroClasse, busca]);

  return (
    <Card className="col-span-4 shadow-none border-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-slate-900">Detalhamento da Frota</h3>
          <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                      type="text"
                      placeholder="Buscar navio..."
                      className="h-9 w-full sm:w-[200px] rounded-md border border-slate-300 bg-white pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                  />
              </div>
              <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <select
                      className="h-9 w-full sm:w-[180px] rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 cursor-pointer"
                      value={filtroClasse}
                      onChange={(e) => setFiltroClasse(e.target.value)}
                  >
                      <option value="todos">Todas as Classes</option>
                      {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </div>
      </div>
      
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Navio</th>
                <th className="p-4">Classe</th>
                <th className="p-4 text-right">Qtd IWS</th>
                <th className="p-4">Última IWS</th>
                <th className="p-4 text-right">Mediana (dias)</th>
                <th className="p-4 text-right">Velocidade (kn)</th>
                <th className="p-4 text-right">Consumo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length > 0 ? (
                filtrados.map((navio, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-blue-900">{navio["Nome do navio"]}</td>
                    <td className="p-4">
                        <Badge variant="default">{navio.Classe}</Badge>
                    </td>
                    <td className="p-4 text-right">{navio.qtd_iws ?? 0}</td>
                    <td className="p-4 text-slate-600">
                        {navio.ultima_iws || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-4 text-right font-mono">
                        {navio.mediana_dias_entre_iws ? navio.mediana_dias_entre_iws.toFixed(0) : "-"}
                    </td>
                    <td className="p-4 text-right">
                        {navio.velocidade_media ? navio.velocidade_media.toFixed(1) : "-"}
                    </td>
                    <td className="p-4 text-right text-slate-600">
                         {navio.combustivel_total ? navio.combustivel_total.toFixed(0) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Nenhum navio encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function PaineisBiologia({ dados }) {
    if (!dados) return null;
    const secoes = [
        { chave: "embarcacao", titulo: "Geral da Embarcação", icon: <Ship className="h-4 w-4"/> },
        { chave: "helice", titulo: "Hélice (Propulsor)", icon: <Anchor className="h-4 w-4"/> },
        { chave: "costado", titulo: "Costado Vertical", icon: <Droplet className="h-4 w-4"/> },
        { chave: "fundo_chato", titulo: "Fundo Chato", icon: <div className="h-4 w-4 bg-slate-400 rounded-sm"/> },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {secoes.map((secao) => (
                <Card key={secao.chave}>
                    <CardHeader className="pb-3 border-b border-slate-100 mb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {secao.icon} {secao.titulo}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(dados[secao.chave] || []).length > 0 ? (
                                (dados[secao.chave]).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                                        <span className="text-sm font-medium text-slate-700 capitalize">{item.tipo}</span>
                                        <Badge variant={idx === 0 ? "danger" : "default"}>
                                            {item.quantidade} oc.
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic p-2">Sem registros específicos.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EstatisticasTecnicas({ intervalosClasse, intervalosNavio }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Métricas por Classe</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 font-semibold border-b">
                                <tr>
                                    <th className="p-3">Classe</th>
                                    <th className="p-3 text-right">Navios</th>
                                    <th className="p-3 text-right">Média (Dias)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(intervalosClasse || []).map((linha) => (
                                    <tr key={linha.classe} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium">{linha.classe}</td>
                                        <td className="p-3 text-right">{linha.qtd_navios_com_historico}</td>
                                        <td className="p-3 text-right font-mono text-blue-700">
                                            {linha.media_mediana_dias_entre_iws.toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Histórico de Intervalos</CardTitle></CardHeader>
                <CardContent>
                     <div className="overflow-y-auto max-h-[300px] rounded-md border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 font-semibold sticky top-0 border-b">
                                <tr>
                                    <th className="p-3">Navio</th>
                                    <th className="p-3 text-right">Mín (dias)</th>
                                    <th className="p-3 text-right">Máx (dias)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(intervalosNavio || []).map((linha) => (
                                    <tr key={linha.Embarcação} className="hover:bg-slate-50">
                                        <td className="p-3 text-xs font-medium">{linha.Embarcação}</td>
                                        <td className="p-3 text-right text-xs">{linha.min_dias_entre_iws}</td>
                                        <td className="p-3 text-right text-xs">{linha.max_dias_entre_iws}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL ---
export default function HistoricoIWS({ 
    kpis, 
    naviosResumo = [], 
    intervalosNavio = [], 
    intervalosClasse = [], 
    tiposIncrustacao = {} 
}) {
  
  const [activeTab, setActiveTab] = useState("geral");

  // Função para classes do botão (Tab)
  const tabClass = (tabName) => `
    flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200
    ${activeTab === tabName 
        ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" 
        : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200"
    }
  `;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 rounded-2xl shadow-sm space-y-6 pb-24">
        
        {/* Cabeçalho */}
        <div>
             <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Histórico de Manutenções</h2>
             <p className="text-slate-500">Registro consolidado de inspeções subaquáticas (IWS) e análises biológicas.</p>
        </div>

        <ResumoCards kpis={kpis} />

        {/* Menu de Abas (Visual Novo) */}
        <div className="flex gap-1  0 p-1 bg-slate-100 rounded-lg w-full md:w-fit border border-slate-200">
            <button onClick={() => setActiveTab("geral")} className={tabClass("geral")}>
                Visão Geral da Frota
            </button>
            <button onClick={() => setActiveTab("estatisticas")} className={tabClass("estatisticas")}>
                Estatísticas de Intervalos
            </button>
            <button onClick={() => setActiveTab("biologia")} className={tabClass("biologia")}>
                Análise Biológica
            </button>
        </div>

        {/* Conteúdo dinâmico das abas */}
        <div className="animate-in fade-in duration-300">
            {activeTab === "geral" && (
                <TabelaNaviosResumo dados={naviosResumo} />
            )}

            {activeTab === "estatisticas" && (
                <EstatisticasTecnicas 
                    intervalosClasse={intervalosClasse} 
                    intervalosNavio={intervalosNavio} 
                />
            )}

            {activeTab === "biologia" && (
                <PaineisBiologia dados={tiposIncrustacao} />
            )}
        </div>
    </div>
  );
}