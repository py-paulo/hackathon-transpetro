import React, { useState, useMemo, useEffect } from "react";
import { 
  Ship, 
  FileText, 
  Microscope, 
  Anchor,
  Droplet,
  Search, 
  Filter,
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
  Sparkles
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

function ResumoCards() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarDados() {
      try {
        const response = await fetch('http://localhost:3000/api/sugestao_limpeza');
        
        if (response.ok) {
          const resultado = await response.json();
          if (resultado.success) {
            setDados(resultado.data || []);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados para resumo:', err);
      } finally {
        setCarregando(false);
      }
    }
    
    buscarDados();
  }, []);

  // Calcula métricas
  const totalNavios = dados.length;
  const naviosCriticos = dados.filter(d => d.urgencia === "CRÍTICA").length;
  const naviosAltos = dados.filter(d => d.urgencia === "ALTA").length;
  
  const economiaTotal = dados.reduce((sum, d) => sum + (d.economia_anual_estimada || 0), 0);
  const economiaFormatada = economiaTotal > 0 
    ? `R$ ${(economiaTotal / 1000000).toFixed(1)}M`
    : "R$ 0";

  const diasMediosSemDocagem = dados.length > 0
    ? Math.round(dados.reduce((sum, d) => sum + (d.dias_sem_docagem || 0), 0) / dados.length)
    : 0;

  if (carregando) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-slate-500">-</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Navios com Sugestões</CardTitle>
          <Ship className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalNavios}</div>
          <p className="text-xs text-slate-500">
            {naviosCriticos} críticos, {naviosAltos} alta urgência
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urgência Crítica</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{naviosCriticos}</div>
          <p className="text-xs text-slate-500">Requerem ação imediata</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia Potencial</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{economiaFormatada}</div>
          <p className="text-xs text-slate-500">Economia anual estimada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dias sem Docagem</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{diasMediosSemDocagem}</div>
          <p className="text-xs text-slate-500">Média da frota</p>
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

function SugestoesLimpeza() {
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [filtroUrgencia, setFiltroUrgencia] = useState("todas");
    const [busca, setBusca] = useState("");
    const [ordenacao, setOrdenacao] = useState("prioridade"); // prioridade, navio, dias

    useEffect(() => {
        async function buscarDados() {
            setCarregando(true);
            setErro(null);
            
            try {
                const response = await fetch('http://localhost:3000/api/sugestao_limpeza');
                
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
                }
                
                const resultado = await response.json();
                
                if (!resultado.success) {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
                
                setDados(resultado.data || []);
            } catch (err) {
                console.error('Erro ao buscar sugestões:', err);
                setErro(err.message);
                setDados([]);
            } finally {
                setCarregando(false);
            }
        }
        
        buscarDados();
    }, []);

    const dadosFiltrados = useMemo(() => {
        let filtrados = dados.filter((item) => {
            const matchUrgencia = filtroUrgencia === "todas" || item.urgencia === filtroUrgencia;
            const matchBusca = busca === "" || 
                item.navio?.toLowerCase().includes(busca.toLowerCase()) ||
                item.classe?.toLowerCase().includes(busca.toLowerCase());
            return matchUrgencia && matchBusca;
        });

        // Ordenação
        filtrados.sort((a, b) => {
            if (ordenacao === "prioridade") {
                return a.prioridade - b.prioridade;
            } else if (ordenacao === "navio") {
                return (a.navio || "").localeCompare(b.navio || "");
            } else if (ordenacao === "dias") {
                return (b.dias_sem_docagem || 0) - (a.dias_sem_docagem || 0);
            }
            return 0;
        });

        return filtrados;
    }, [dados, filtroUrgencia, busca, ordenacao]);

    const obterVariantUrgencia = (urgencia) => {
        const map = {
            "CRÍTICA": "danger",
            "ALTA": "warning",
            "MODERADA": "default",
            "BAIXA": "success",
            "NÃO URGENTE": "success"
        };
        return map[urgencia] || "default";
    };

    const obterCorUrgencia = (urgencia) => {
        const map = {
            "CRÍTICA": "text-red-600",
            "ALTA": "text-amber-600",
            "MODERADA": "text-yellow-600",
            "BAIXA": "text-blue-600",
            "NÃO URGENTE": "text-green-600"
        };
        return map[urgencia] || "text-slate-600";
    };

    const formatarRecomendacao = (texto) => {
        if (!texto) return "";
        // Converte markdown simples para HTML
        return texto
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />')
            .replace(/•/g, '•');
    };

    if (carregando) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-slate-500">Carregando sugestões de limpeza...</p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold">Erro ao carregar dados</p>
                    <p className="text-sm text-slate-500 mt-2">{erro}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros e Busca */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar navio ou classe..."
                                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <select
                                className="h-10 w-full md:w-[200px] rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 cursor-pointer"
                                value={filtroUrgencia}
                                onChange={(e) => setFiltroUrgencia(e.target.value)}
                            >
                                <option value="todas">Todas Urgências</option>
                                <option value="CRÍTICA">Crítica</option>
                                <option value="ALTA">Alta</option>
                                <option value="MODERADA">Moderada</option>
                                <option value="BAIXA">Baixa</option>
                                <option value="NÃO URGENTE">Não Urgente</option>
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                className="h-10 w-full md:w-[180px] rounded-md border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500 cursor-pointer"
                                value={ordenacao}
                                onChange={(e) => setOrdenacao(e.target.value)}
                            >
                                <option value="prioridade">Por Prioridade</option>
                                <option value="navio">Por Navio</option>
                                <option value="dias">Por Dias sem Docagem</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Cards */}
            {dadosFiltrados.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <Ship className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Nenhuma sugestão encontrada</p>
                            <p className="text-sm text-slate-400 mt-2">Tente ajustar os filtros</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {dadosFiltrados.map((item) => (
                        <Card key={item._id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-1">{item.navio}</CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="default" className="text-xs">
                                                {item.classe}
                                            </Badge>
                                            <Badge variant={obterVariantUrgencia(item.urgencia)}>
                                                {item.urgencia}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-bold ${obterCorUrgencia(item.urgencia)}`}>
                                        #{item.prioridade}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {/* Fatores Considerados */}
                                {item.fatores_considerados && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Fatores
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {item.fatores_considerados}
                                        </p>
                                    </div>
                                )}

                                {/* Métricas Principais */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" /> Taxa Deterioração
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.taxa_deterioracao_mes ? item.taxa_deterioracao_mes.toFixed(6) : 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-500">ton/nm/mês</p>
                                        {item.aumento_percentual && (
                                            <p className={`text-xs mt-1 font-medium ${
                                                item.aumento_percentual > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {item.aumento_percentual > 0 ? '+' : ''}{item.aumento_percentual.toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Sem Docagem
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.dias_sem_docagem || 0} dias
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.anos_sem_docagem ? item.anos_sem_docagem.toFixed(1) : '0'} anos
                                        </p>
                                        {item.ultima_docagem && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(item.ultima_docagem).toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ROI e Economia (se disponível) */}
                                {item.roi_percentual !== null && item.roi_percentual !== undefined && (
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-green-700 mb-1">ROI Estimado</p>
                                                <p className={`text-lg font-bold ${
                                                    item.roi_percentual > 0 ? 'text-green-700' : 'text-red-600'
                                                }`}>
                                                    {item.roi_percentual > 0 ? '+' : ''}{item.roi_percentual.toFixed(1)}%
                                                </p>
                                            </div>
                                            {item.payback_meses && (
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-green-700 mb-1">Payback</p>
                                                    <p className="text-lg font-bold text-green-700">
                                                        {item.payback_meses.toFixed(1)}m
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {item.economia_anual_estimada > 0 && (
                                            <div className="mt-2 pt-2 border-t border-green-200">
                                                <p className="text-xs text-green-600 flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Economia anual: R$ {item.economia_anual_estimada.toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Prazo Sugerido */}
                                {item.prazo_sugerido_dias && (
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-semibold text-blue-700">Prazo Sugerido</p>
                                                <p className="text-sm font-bold text-blue-900">
                                                    {item.prazo_sugerido_dias} dias
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Recomendação */}
                                {item.recomendacao && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" /> Recomendação
                                        </p>
                                        <div 
                                            className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: formatarRecomendacao(item.recomendacao) }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
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

        <ResumoCards />

        {/* Menu de Abas (Visual Novo) */}
        <div className="flex gap-1  0 p-1 bg-slate-100 rounded-lg w-full md:w-fit border border-slate-200">
            <button onClick={() => setActiveTab("geral")} className={tabClass("geral")}>
                Visão Geral da Frota
            </button>
            <button onClick={() => setActiveTab("sugestoes")} className={tabClass("sugestoes")}>
                Sugestões de Limpeza
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

            {activeTab === "sugestoes" && (
                <SugestoesLimpeza />
            )}
        </div>
    </div>
  );
}