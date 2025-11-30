import React, { useState, useEffect, useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { 
  Ship, 
  Navigation, 
  Wind, 
  Thermometer, 
  Droplets,
  ChevronRight,
  Activity,
  AlertTriangle
} from "lucide-react";

// Importando o Mapa que já fizemos
import MapaAIS from "../mapaAIS/mapaAIS"; // Verifique se o caminho está certo

// --- COMPONENTES VISUAIS (Cards) ---
const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-slate-100 text-slate-800",
    danger: "bg-red-100 text-red-800 border border-red-200",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// --- FUNÇÃO PARA AGRUPAR DADOS POR NAVIO ---
const agruparDadosPorNavio = (dados) => {
  const grupos = {};
  
  dados.forEach((item) => {
    // Ignora registros de TOTAL_FROTA
    if (item.shipName === "TOTAL_FROTA") return;
    
    const nomeNavio = item.shipName;
    
    if (!grupos[nomeNavio]) {
      grupos[nomeNavio] = {
        shipName: nomeNavio,
        Classe: item.Classe,
        // Campos de soma
        consumo_total: 0,
        num_viagens: 0,
        distancia_total: 0,
        duracao_total: 0,
        // Campos para calcular média
        consumo_medio_soma: 0,
        consumo_por_milha_soma: 0,
        consumo_por_hora_soma: 0,
        count: 0,
        // Dados temporais para o gráfico
        dadosTemporais: []
      };
    }
    
    const grupo = grupos[nomeNavio];
    
    // Soma campos de soma
    grupo.consumo_total += item.consumo_total || 0;
    grupo.num_viagens += item.num_viagens || 0;
    grupo.distancia_total += item.distancia_total || 0;
    grupo.duracao_total += item.duracao_total || 0;
    
    // Acumula para média
    grupo.consumo_medio_soma += item.consumo_medio || 0;
    grupo.consumo_por_milha_soma += item.consumo_por_milha || 0;
    grupo.consumo_por_hora_soma += item.consumo_por_hora || 0;
    grupo.count += 1;
    
    // Adiciona dados temporais para o gráfico
    grupo.dadosTemporais.push({
      periodo: `${item.ano}-${String(item.mes).padStart(2, '0')}`,
      ano: item.ano,
      mes: item.mes,
      consumo_medio: item.consumo_medio || 0
    });
  });
  
  // Calcula médias e ordena dados temporais
  return Object.values(grupos).map((grupo) => {
    const count = grupo.count || 1;
    return {
      ...grupo,
      consumo_medio: grupo.consumo_medio_soma / count,
      consumo_por_milha: grupo.consumo_por_milha_soma / count,
      consumo_por_hora: grupo.consumo_por_hora_soma / count,
      dadosTemporais: grupo.dadosTemporais.sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      }),
      // Campos para compatibilidade com o componente
      "Nome do navio": grupo.shipName,
      Tipo: grupo.Classe, // Assumindo que Tipo = Classe
      velocidade_media: 0, // Não temos esse dado na API
      combustivel_total: grupo.consumo_total * 100 // Convertendo para compatibilidade
    };
  });
};

// --- FUNÇÃO PARA FILTRAR POR PERÍODO (ano/mes) ---
const filtrarPorPeriodo = (dados, dataInicio, dataFim) => {
  if (!dataInicio && !dataFim) return dados;
  
  return dados.filter((item) => {
    // Cria data do primeiro dia do mês do item
    const itemData = new Date(item.ano, item.mes - 1, 1);
    
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      // Normaliza para o primeiro dia do mês
      const inicioNormalizado = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
      if (itemData < inicioNormalizado) return false;
    }
    
    if (dataFim) {
      const fim = new Date(dataFim);
      // Normaliza para o primeiro dia do mês seguinte para incluir o mês final
      const fimNormalizado = new Date(fim.getFullYear(), fim.getMonth() + 1, 1);
      if (itemData >= fimNormalizado) return false;
    }
    
    return true;
  });
};

// --- FUNÇÃO PARA OBTER COR BASEADA NO SCORE ---
const obterCorPorScore = (score) => {
    if (score === null || score === undefined) return "rgba(148, 163, 184, 0.3)"; // Cinza para sem dados
    
    // Score vai de 0 (limpo) a 1 (crítico)
    if (score >= 0.7) {
        return "rgba(239, 68, 68, 0.8)"; // Vermelho - Crítico
    } else if (score >= 0.4) {
        return "rgba(245, 158, 11, 0.6)"; // Laranja - Atenção
    } else if (score > 0) {
        return "rgba(251, 191, 36, 0.4)"; // Amarelo - Moderado
    } else {
        return "rgba(148, 163, 184, 0.3)"; // Cinza - Limpo
    }
};

// --- SUB-COMPONENTE: DETALHES DO NAVIO (Drill-down) ---
const DetalhesNavio = ({ navio, dadosIWS = [] }) => {
    if (!navio) return null;

    // Prepara dados para o gráfico de consumo vs tempo
    const dadosGrafico = navio.dadosTemporais || [];
    
    // Busca dados de IWS mais recentes para este navio
    const nomeNavio = navio.shipName || navio["Nome do navio"];
    const dadosNavioIWS = dadosIWS
        .filter(item => {
            // Compara nomes (case insensitive e remove espaços extras)
            const nomeItem = (item.navio || "").trim().toUpperCase();
            const nomeNavioUpper = (nomeNavio || "").trim().toUpperCase();
            return nomeItem === nomeNavioUpper;
        })
        .sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao)); // Mais recente primeiro
    
    const inspecaoMaisRecente = dadosNavioIWS[0];
    
    // Extrai scores (usa null se não houver dados)
    const scoreFundo = inspecaoMaisRecente?.condicao_fundo ?? inspecaoMaisRecente?.score_bioincrustacao ?? null;
    const scoreCostado = inspecaoMaisRecente?.condicao_costado ?? inspecaoMaisRecente?.score_bioincrustacao ?? null;
    const scoreHelice = inspecaoMaisRecente?.condicao_helice ?? inspecaoMaisRecente?.score_bioincrustacao ?? null;
    const scoreGeral = inspecaoMaisRecente?.score_bioincrustacao ?? null;
    
    // Usa score_bioincrustacao para o fundo chato (médio) conforme solicitado
    const scoreFundoChato = inspecaoMaisRecente?.score_bioincrustacao ?? null;

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-4 duration-300">
            <div className="grid lg:grid-cols-2 gap-6">
                
                {/* 1. Gráfico Consumo Médio vs Tempo */}
                <Card>
                    <div className="p-4 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" /> Consumo Médio ao Longo do Tempo
                        </h4>
                        <p className="text-xs text-slate-500">Evolução do consumo médio por período (ton/dia)</p>
                    </div>
                    <div className="p-4 h-[250px] w-full">
                        {dadosGrafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dadosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                                    <XAxis 
                                        dataKey="periodo" 
                                        label={{ value: 'Período (Ano-Mês)', position: 'insideBottom', offset: -5, fontSize: 10 }} 
                                        fontSize={12} 
                                        stroke="#94a3b8"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        label={{ value: 'Consumo Médio (ton/dia)', angle: -90, position: 'insideLeft', fontSize: 10 }} 
                                        fontSize={12} 
                                        stroke="#94a3b8"
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                                    <Legend verticalAlign="top" height={36}/>
                                    <Line 
                                        type="monotone" 
                                        dataKey="consumo_medio" 
                                        name="Consumo Médio" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2} 
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <p>Sem dados disponíveis para o período selecionado</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. Heatmap do Casco (Dados Reais) */}
                <Card>
                    <div className="p-4 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-amber-600" /> Condição do Casco (Heatmap)
                        </h4>
                        <p className="text-xs text-slate-500">
                            {inspecaoMaisRecente 
                                ? `Última inspeção: ${new Date(inspecaoMaisRecente.data_inspecao).toLocaleDateString('pt-BR')} - ${inspecaoMaisRecente.local_inspecao}`
                                : "Áreas com maior probabilidade de bioincrustação."}
                        </p>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center h-[250px] relative bg-blue-50/30">
                        {/* Desenho simples de um navio usando CSS/SVG */}
                        <svg viewBox="0 0 400 120" className="w-full h-full drop-shadow-md">
                            {/* Casco */}
                            <path d="M 20,40 Q 20,100 60,100 L 340,100 Q 380,100 380,40 L 20,40" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                            {/* Linha D'água */}
                            <line x1="10" y1="50" x2="390" y2="50" stroke="#3b82f6" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" />
                            
                            {/* Áreas de Incrustação (Heatmap) - Dados Reais */}
                            {/* Hélice */}
                            <circle 
                                cx="45" 
                                cy="85" 
                                r="15" 
                                fill={obterCorPorScore(scoreHelice)} 
                                className={scoreHelice !== null && scoreHelice >= 0.7 ? "animate-pulse" : ""}
                                opacity={scoreHelice !== null ? 1 : 0.5}
                            />
                            <text x="45" y="85" fontSize="9" fill={scoreHelice !== null && scoreHelice >= 0.5 ? "white" : "#64748b"} textAnchor="middle" dy="3" fontWeight="bold">
                                {scoreHelice !== null ? (scoreHelice * 100).toFixed(0) + '%' : 'N/A'}
                            </text>
                            <text x="45" y="95" fontSize="8" fill="#64748b" textAnchor="middle">Hélice</text>
                            
                            {/* Fundo Chato - Usa score_bioincrustacao conforme solicitado */}
                            <rect 
                                x="150" 
                                y="85" 
                                width="100" 
                                height="15" 
                                fill={obterCorPorScore(scoreFundoChato)} 
                                rx="5"
                                opacity={scoreFundoChato !== null ? 1 : 0.5}
                            />
                            <text x="200" y="92" fontSize="9" fill={scoreFundoChato !== null && scoreFundoChato >= 0.5 ? "white" : "#64748b"} textAnchor="middle" fontWeight="bold">
                                {scoreFundoChato !== null ? (scoreFundoChato * 100).toFixed(0) + '%' : 'N/A'}
                            </text>
                            <text x="200" y="103" fontSize="8" fill="#64748b" textAnchor="middle">Fundo</text>
                            
                            {/* Linha d'água (Costado) */}
                            <rect 
                                x="80" 
                                y="45" 
                                width="240" 
                                height="10" 
                                fill={obterCorPorScore(scoreCostado)} 
                                opacity={scoreCostado !== null ? 1 : 0.5}
                            />
                            <text x="200" y="51" fontSize="9" fill={scoreCostado !== null && scoreCostado >= 0.5 ? "white" : "#64748b"} textAnchor="middle" fontWeight="bold">
                                {scoreCostado !== null ? (scoreCostado * 100).toFixed(0) + '%' : 'N/A'}
                            </text>
                            <text x="200" y="60" fontSize="8" fill="#64748b" textAnchor="middle">Costado</text>
                        </svg>
                        
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div> Crítico (≥70%)
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Atenção (40-70%)
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div> Limpo (&lt;40%)
                            </span>
                        </div>
                        {inspecaoMaisRecente && (
                            <p className="text-xs text-slate-400 mt-1">
                                Tipo: {inspecaoMaisRecente.tipo_incrustacao || 'N/A'} | 
                                Score Geral: {inspecaoMaisRecente.score_bioincrustacao ? (inspecaoMaisRecente.score_bioincrustacao * 100).toFixed(1) + '%' : 'N/A'}
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function MonitoramentoFrota({ trilhas = [], naviosResumo = [] }) {
    
    // Estados para filtros de data (compartilhados com MapaAIS)
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    
    // Estados para dados da API
    const [dadosConsumo, setDadosConsumo] = useState([]);
    const [dadosIWS, setDadosIWS] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [carregandoIWS, setCarregandoIWS] = useState(false);
    const [erro, setErro] = useState(null);
    
    // Estado para controlar qual navio está expandido na lista
    const [navioExpandido, setNavioExpandido] = useState(null);

    const toggleNavio = (nome) => {
        if (navioExpandido === nome) {
            setNavioExpandido(null);
        } else {
            setNavioExpandido(nome);
        }
    };

    // Busca dados da API quando os filtros mudam
    useEffect(() => {
        async function buscarDados() {
            setCarregando(true);
            setErro(null);
            
            try {
                // Monta URL com parâmetros
                const url = new URL('http://localhost:3000/api/consumo-mensal');
                url.searchParams.set('limit', '10000'); // Busca todos os registros
                
                const response = await fetch(url.toString());
                
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
                }
                
                const resultado = await response.json();
                
                if (!resultado.success) {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
                
                // Filtra por período se houver filtros
                let dadosFiltrados = resultado.data || [];
                if (dataInicio || dataFim) {
                    dadosFiltrados = filtrarPorPeriodo(dadosFiltrados, dataInicio, dataFim);
                }
                
                // Agrupa por navio
                const dadosAgrupados = agruparDadosPorNavio(dadosFiltrados);
                setDadosConsumo(dadosAgrupados);
                
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
                setErro(err.message);
                setDadosConsumo([]);
            } finally {
                setCarregando(false);
            }
        }
        
        buscarDados();
    }, [dataInicio, dataFim]);

    // Busca dados de IWS quando os filtros mudam
    useEffect(() => {
        async function buscarDadosIWS() {
            setCarregandoIWS(true);
            
            try {
                const url = new URL('http://localhost:3000/api/iws-deterioracao');
                url.searchParams.set('limit', '10000');
                
                const response = await fetch(url.toString());
                
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados IWS: ${response.statusText}`);
                }
                
                const resultado = await response.json();
                
                if (!resultado.success) {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
                
                // Filtra por período se houver filtros
                let dadosFiltrados = resultado.data || [];
                if (dataInicio || dataFim) {
                    dadosFiltrados = dadosFiltrados.filter((item) => {
                        const dataInspecao = new Date(item.data_inspecao);
                        
                        if (dataInicio) {
                            const inicio = new Date(dataInicio);
                            if (dataInspecao < inicio) return false;
                        }
                        
                        if (dataFim) {
                            const fim = new Date(dataFim);
                            fim.setHours(23, 59, 59, 999); // Fim do dia
                            if (dataInspecao > fim) return false;
                        }
                        
                        return true;
                    });
                }
                
                setDadosIWS(dadosFiltrados);
                
            } catch (err) {
                console.error('Erro ao buscar dados IWS:', err);
                setDadosIWS([]);
            } finally {
                setCarregandoIWS(false);
            }
        }
        
        buscarDadosIWS();
    }, [dataInicio, dataFim]);

    // Calcula estatísticas para determinar status
    const estatisticas = useMemo(() => {
        if (dadosConsumo.length === 0) return null;
        
        const consumosPorMilha = dadosConsumo.map(n => n.consumo_por_milha || 0).filter(v => v > 0);
        if (consumosPorMilha.length === 0) return null;
        
        const media = consumosPorMilha.reduce((a, b) => a + b, 0) / consumosPorMilha.length;
        const desvioPadrao = Math.sqrt(
            consumosPorMilha.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / consumosPorMilha.length
        );
        
        return { media, desvioPadrao };
    }, [dadosConsumo]);

    // Função para calcular status baseado nos dados
    const calcularStatus = (navio) => {
        if (!estatisticas || !navio.consumo_por_milha) return "success";
        
        const { media, desvioPadrao } = estatisticas;
        const consumoNavio = navio.consumo_por_milha;
        
        // Se está acima de 1.5 desvios padrão da média, é crítico
        if (consumoNavio > media + 1.5 * desvioPadrao) {
            return "danger";
        }
        // Se está acima de 0.5 desvios padrão, é atenção
        if (consumoNavio > media + 0.5 * desvioPadrao) {
            return "warning";
        }
        // Caso contrário, operacional
        return "success";
    };

    // Usa dados da API ou fallback para naviosResumo
    const naviosParaExibir = useMemo(() => {
        if (dadosConsumo.length > 0) {
            return dadosConsumo;
        }
        // Fallback para dados estáticos se API não retornar nada
        return naviosResumo;
    }, [dadosConsumo, naviosResumo]);

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6 rounded-2xl shadow-sm space-y-6 pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2">
                        <Navigation className="h-8 w-8 text-blue-600" /> Monitoramento de Frota
                    </h2>
                    <p className="text-slate-500">Rastreamento em tempo real e telemetria de performance.</p>
                </div>
                
                {/* Stats Rápidos */}
                <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full text-green-600"><Wind className="h-4 w-4"/></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Mar</p>
                            <p className="text-sm font-semibold">Calmo</p>
                        </div>
                    </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Thermometer className="h-4 w-4"/></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Água</p>
                            <p className="text-sm font-semibold">24°C (Méd)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 1: O MAPA (HERO) */}
            <div className="w-full">
                <MapaAIS 
                    trilhas={trilhas} 
                    naviosResumo={naviosResumo}
                    dataInicio={dataInicio}
                    dataFim={dataFim}
                    onDataInicioChange={setDataInicio}
                    onDataFimChange={setDataFim}
                />
            </div>

            {/* SEÇÃO 2: LISTA DE NAVIOS COM DRILL-DOWN */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Status da Frota</h3>
                    {carregando && (
                        <span className="text-sm text-slate-500">Carregando dados...</span>
                    )}
                    {erro && (
                        <span className="text-sm text-red-500">Erro: {erro}</span>
                    )}
                </div>
                
                {carregando ? (
                    <div className="flex items-center justify-center p-8">
                        <p className="text-slate-500">Carregando dados da API...</p>
                    </div>
                ) : naviosParaExibir.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <p className="text-slate-500">Nenhum navio encontrado para o período selecionado.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {naviosParaExibir.map((navio, idx) => {
                        const isExpanded = navioExpandido === navio["Nome do navio"];
                        
                        // Calcula status baseado nos dados reais
                        const status = calcularStatus(navio);
                        const statusText = status === "danger" ? "Crítico" : status === "warning" ? "Atenção" : "Operacional";

                        return (
                            <div key={idx} className={`bg-white border rounded-xl transition-all duration-300 ${isExpanded ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}>
                                
                                {/* Linha do Navio (Clicável) */}
                                <div 
                                    className="p-4 flex flex-wrap items-center justify-between cursor-pointer gap-4"
                                    onClick={() => toggleNavio(navio["Nome do navio"])}
                                >
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className={`p-2 rounded-full ${status === 'danger' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                                            <Ship className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{navio["Nome do navio"] || navio.shipName}</p>
                                            <p className="text-xs text-slate-500">{navio.Classe || 'N/A'}{navio.Tipo && navio.Tipo !== navio.Classe ? ` • ${navio.Tipo}` : ''}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 text-sm text-slate-600 hidden md:flex">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400">Consumo Total</p>
                                            <p className="font-mono font-semibold">{navio.consumo_total ? navio.consumo_total.toFixed(1) : 0} ton</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400">Consumo Médio</p>
                                            <p className="font-mono font-semibold">{navio.consumo_medio ? navio.consumo_medio.toFixed(1) : 0} t/dia</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400">Viagens</p>
                                            <p className="font-mono font-semibold">{navio.num_viagens || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge variant={status}>{statusText}</Badge>
                                        <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {/* Conteúdo Expandido (Detalhes) */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-slate-100">
                                        <DetalhesNavio navio={navio} dadosIWS={dadosIWS} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>
        </div>
    );
}