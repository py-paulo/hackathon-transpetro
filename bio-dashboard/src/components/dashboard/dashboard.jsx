import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { 
  Ship, 
  AlertTriangle, 
  Leaf, 
  TrendingUp, 
  Droplets, 
  Activity,
  DollarSign,
  Fuel,
  Zap,
  Filter,
  Calendar
} from "lucide-react";

// --- CORES DA MARCA ---
const COLORS = ["#004aad", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// --- DADOS MOCKADOS (O Segredo para o gráfico sempre aparecer) ---
const MOCK_NAVIOS = [
  { name: "Dragão do Mar", dias: 750 },
  { name: "Anita Garibaldi", dias: 620 },
  { name: "Zumbi dos Palmares", dias: 580 },
  { name: "Marcílio Dias", dias: 500 },
  { name: "André Rebouças", dias: 450 },
  { name: "Milton Santos", dias: 400 },
  { name: "Rômulo Almeida", dias: 350 },
  { name: "João Cândido", dias: 300 },
];

const MOCK_PIZZA = [
  { name: "Cracas", value: 45 },
  { name: "Limo", value: 30 },
  { name: "Algas", value: 15 },
  { name: "Outros", value: 10 },
];

const MOCK_RADAR = [
  { name: "Suezmax", mediana: 650 },
  { name: "Aframax", mediana: 500 },
  { name: "Panamax", mediana: 420 },
  { name: "Handymax", mediana: 300 },
  { name: "Gaseiro", mediana: 550 },
];

// --- COMPONENTES VISUAIS (Shadcn Style) ---
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

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-slate-500 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const FilterBadge = ({ icon: Icon, label, children }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon className="h-3 w-3" />} {label}
    </label>
    {children}
  </div>
);

const Select = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="h-10 w-full min-w-[160px] appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {options}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </div>
  </div>
);

const DateInput = ({ value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={onChange}
    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  />
);

export default function DashboardFrota() {
  const [dadosDeterioracao, setDadosDeterioracao] = useState([]);
  const [dadosEficiencia, setDadosEficiencia] = useState([]);
  const [cotacaoCombustivel, setCotacaoCombustivel] = useState(3500); // R$/ton (padrão, pode buscar API real)
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Estados para filtros
  const [classeFiltro, setClasseFiltro] = useState("todas");
  const [navioFiltro, setNavioFiltro] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Busca dados das APIs
  useEffect(() => {
    async function buscarDados() {
      setCarregando(true);
      setErro(null);
      
      try {
        const [deterioracaoRes, eficienciaRes] = await Promise.all([
          fetch('http://localhost:3000/api/deterioracao'),
          fetch('http://localhost:3000/api/eficiencia')
        ]);

        if (!deterioracaoRes.ok || !eficienciaRes.ok) {
          throw new Error('Erro ao buscar dados das APIs');
        }

        const deterioracaoJson = await deterioracaoRes.json();
        const eficienciaJson = await eficienciaRes.json();

        if (deterioracaoJson.success) {
          setDadosDeterioracao(deterioracaoJson.data || []);
        }
        if (eficienciaJson.success) {
          setDadosEficiencia(eficienciaJson.data || []);
        }

        // Busca cotação de combustível (pode usar API real como exemplo)
        // Por enquanto usa valor padrão
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }

    buscarDados();
  }, []);

  // Extrai classes e navios únicos dos dados
  const classes = useMemo(() => {
    const set = new Set();
    dadosEficiencia.forEach(e => {
      if (e.Classe && e.Classe !== "TODAS") {
        set.add(e.Classe);
      }
    });
    return Array.from(set).sort();
  }, [dadosEficiencia]);

  const navios = useMemo(() => {
    const set = new Set();
    dadosDeterioracao.forEach(d => {
      if (d.navio) set.add(d.navio);
    });
    return Array.from(set).sort();
  }, [dadosDeterioracao]);

  // Mapeia navio -> classe usando dados de eficiência
  const mapaNavioClasse = useMemo(() => {
    const mapa = {};
    dadosEficiencia.forEach(e => {
      if (e.shipName && e.shipName !== "TOTAL_FROTA" && e.Classe && e.Classe !== "TODAS") {
        mapa[e.shipName] = e.Classe;
      }
    });
    return mapa;
  }, [dadosEficiencia]);

  const naviosDaClasse = useMemo(() => {
    if (classeFiltro === "todas") return navios;
    
    // Filtra navios pela classe usando o mapa
    return navios.filter(navio => mapaNavioClasse[navio] === classeFiltro);
  }, [classeFiltro, navios, mapaNavioClasse]);

  // Aplica filtros aos dados
  const dadosDeterioracaoFiltrados = useMemo(() => {
    let filtrados = dadosDeterioracao;

    // Filtro por navio
    if (navioFiltro !== "todos") {
      filtrados = filtrados.filter(d => d.navio === navioFiltro);
    } else if (classeFiltro !== "todas") {
      // Se filtrou por classe mas não por navio específico, filtra navios da classe
      const naviosClasse = new Set(naviosDaClasse);
      filtrados = filtrados.filter(d => naviosClasse.has(d.navio));
    }

    // Filtro por data - verifica sobreposição de períodos
    if (dataInicio || dataFim) {
      filtrados = filtrados.filter(d => {
        const dataInicioPeriodo = new Date(d.periodo_inicio);
        const dataFimPeriodo = new Date(d.periodo_fim);
        
        // Se tem dataInicio, verifica se o período termina depois do início do filtro
        if (dataInicio) {
          const dataInicioFiltro = new Date(dataInicio);
          if (dataFimPeriodo < dataInicioFiltro) {
            return false; // Período termina antes do início do filtro
          }
        }
        
        // Se tem dataFim, verifica se o período começa antes do fim do filtro
        if (dataFim) {
          const dataFimFiltro = new Date(dataFim);
          dataFimFiltro.setHours(23, 59, 59, 999);
          if (dataInicioPeriodo > dataFimFiltro) {
            return false; // Período começa depois do fim do filtro
          }
        }
        
        return true; // Período se sobrepõe ao intervalo
      });
    }

    return filtrados;
  }, [dadosDeterioracao, navioFiltro, classeFiltro, dataInicio, dataFim, naviosDaClasse]);

  const dadosEficienciaFiltrados = useMemo(() => {
    let filtrados = dadosEficiencia.filter(e => e.shipName !== "TOTAL_FROTA");

    // Filtro por classe
    if (classeFiltro !== "todas") {
      filtrados = filtrados.filter(e => e.Classe === classeFiltro);
    }

    // Filtro por navio
    if (navioFiltro !== "todos") {
      filtrados = filtrados.filter(e => e.shipName === navioFiltro);
    }

    // Filtro por data (ano/mês)
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      filtrados = filtrados.filter(e => {
        if (!e.ano || !e.mes) return false;
        const dataRegistro = new Date(e.ano, e.mes - 1, 1);
        return dataRegistro >= dataInicioObj;
      });
    }
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      // Inclui o mês completo da data fim
      const dataFimLimite = new Date(dataFimObj.getFullYear(), dataFimObj.getMonth() + 1, 1);
      filtrados = filtrados.filter(e => {
        if (!e.ano || !e.mes) return false;
        const dataRegistro = new Date(e.ano, e.mes - 1, 1);
        return dataRegistro < dataFimLimite;
      });
    }

    return filtrados;
  }, [dadosEficiencia, classeFiltro, navioFiltro, dataInicio, dataFim]);

  // Calcula KPIs usando dados filtrados
  const kpis = useMemo(() => {
    const naviosUnicos = new Set(dadosDeterioracaoFiltrados.map(d => d.navio));
    const totalNavios = naviosUnicos.size;

    // Deterioração média
    const deterioracoesPositivas = dadosDeterioracaoFiltrados.filter(d => d.taxa_deterioracao_mes > 0);
    const deterioracaoMedia = deterioracoesPositivas.length > 0
      ? deterioracoesPositivas.reduce((sum, d) => sum + d.taxa_deterioracao_mes, 0) / deterioracoesPositivas.length
      : 0;

    // Aumento percentual médio
    const aumentosPositivos = dadosDeterioracaoFiltrados.filter(d => d.aumento_percentual_periodo > 0);
    const aumentoMedio = aumentosPositivos.length > 0
      ? aumentosPositivos.reduce((sum, d) => sum + d.aumento_percentual_periodo, 0) / aumentosPositivos.length
      : 0;

    // Consumo extra estimado (baseado na deterioração)
    const consumoExtraTotal = dadosDeterioracaoFiltrados.reduce((sum, d) => {
      if (d.aumento_percentual_periodo > 0 && d.consumo_medio) {
        const consumoBase = d.consumo_medio / (1 + d.aumento_percentual_periodo / 100);
        const consumoExtra = d.consumo_medio - consumoBase;
        return sum + (consumoExtra * d.distancia_total_nm || 0);
      }
      return sum;
    }, 0);

    const gastoExtraMensal = (consumoExtraTotal / 12) * cotacaoCombustivel; // Aproximação mensal

    // Eficiência média
    const eficienciasValidas = dadosEficienciaFiltrados.filter(e => e.eficiencia_transporte);
    const eficienciaMedia = eficienciasValidas.length > 0
      ? eficienciasValidas.reduce((sum, e) => sum + e.eficiencia_transporte, 0) / eficienciasValidas.length
      : 0;

    // CO2 extra (estimativa: ~3.1 ton CO2 por ton de combustível)
    const co2Extra = (consumoExtraTotal / 12) * 3.1;

    return {
      totalNavios,
      deterioracaoMedia,
      aumentoMedio,
      gastoExtraMensal,
      eficienciaMedia,
      co2Extra,
      alertasCriticos: dadosDeterioracaoFiltrados.filter(d => d.aumento_percentual_periodo > 50).length
    };
  }, [dadosDeterioracaoFiltrados, dadosEficienciaFiltrados, cotacaoCombustivel]);

  // Dados para gráfico de deterioração ao longo do tempo
  const dadosDeterioracaoTemporal = useMemo(() => {
    const agrupado = {};
    
    dadosDeterioracaoFiltrados.forEach(d => {
      const navio = d.navio;
      if (!agrupado[navio]) {
        agrupado[navio] = [];
      }
      agrupado[navio].push({
        periodo: d.numero_periodo,
        periodoLabel: `P${d.numero_periodo}`,
        dataInicio: new Date(d.periodo_inicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        taxaDeterioracao: d.taxa_deterioracao_mes * 1000, // Convertendo para melhor visualização
        aumentoPercentual: d.aumento_percentual_periodo,
        consumoMedio: d.consumo_medio
      });
    });

    // Pega os 5 navios com maior deterioração
    const naviosOrdenados = Object.entries(agrupado)
      .sort((a, b) => {
        const maxA = Math.max(...a[1].map(x => x.aumentoPercentual || 0));
        const maxB = Math.max(...b[1].map(x => x.aumentoPercentual || 0));
        return maxB - maxA;
      });

    return naviosOrdenados.map(([navio, dados]) => ({
      navio,
      dados: dados.sort((a, b) => a.periodo - b.periodo)
    }));
  }, [dadosDeterioracaoFiltrados]);

  // Dados formatados para gráfico de linha (todos os períodos juntos)
  const dadosDeterioracaoLinha = useMemo(() => {
    if (dadosDeterioracaoFiltrados.length === 0 || dadosDeterioracaoTemporal.length === 0) {
      return [];
    }
    
    const todosPeriodos = new Set();
    dadosDeterioracaoFiltrados.forEach(d => todosPeriodos.add(d.numero_periodo));
    
    const periodosOrdenados = Array.from(todosPeriodos).sort();
    const naviosTop5 = dadosDeterioracaoTemporal.map(n => n.navio);
    
    return periodosOrdenados.map(periodo => {
      const ponto = { periodo: `P${periodo}` };
      naviosTop5.forEach(navio => {
        const dadosNavio = dadosDeterioracaoFiltrados.find(d => d.navio === navio && d.numero_periodo === periodo);
        ponto[navio] = dadosNavio ? dadosNavio.taxa_deterioracao_mes * 1000 : null;
      });
      return ponto;
    });
  }, [dadosDeterioracaoFiltrados, dadosDeterioracaoTemporal]);

  // Dados formatados para gráfico de consumo
  const dadosConsumoTemporal = useMemo(() => {
    if (dadosDeterioracaoFiltrados.length === 0 || dadosDeterioracaoTemporal.length === 0) {
      return [];
    }
    
    const todosPeriodos = new Set();
    dadosDeterioracaoFiltrados.forEach(d => todosPeriodos.add(d.numero_periodo));
    
    const periodosOrdenados = Array.from(todosPeriodos).sort();
    const naviosTop5 = dadosDeterioracaoTemporal.map(n => n.navio);
    
    return periodosOrdenados.map(periodo => {
      const ponto = { periodo: `P${periodo}` };
      naviosTop5.forEach(navio => {
        const dadosNavio = dadosDeterioracaoFiltrados.find(d => d.navio === navio && d.numero_periodo === periodo);
        ponto[navio] = dadosNavio ? dadosNavio.consumo_medio : null;
      });
      return ponto;
    });
  }, [dadosDeterioracaoFiltrados, dadosDeterioracaoTemporal]);

  // Dados para gráfico de eficiência vs deterioração
  const dadosEficienciaVsDeterioracao = useMemo(() => {
    const naviosComDados = {};
    
    // Agrupa por navio - deterioração
    dadosDeterioracaoFiltrados.forEach(d => {
      if (!naviosComDados[d.navio]) {
        naviosComDados[d.navio] = {
          navio: d.navio,
          deterioracaoSoma: 0,
          deterioracaoCount: 0,
          eficienciaSoma: 0,
          eficienciaCount: 0,
          consumoMedio: d.consumo_medio || 0
        };
      }
      naviosComDados[d.navio].deterioracaoSoma += d.taxa_deterioracao_mes;
      naviosComDados[d.navio].deterioracaoCount += 1;
    });

    // Calcula eficiência média por navio
    dadosEficienciaFiltrados.forEach(e => {
      if (naviosComDados[e.shipName]) {
        naviosComDados[e.shipName].eficienciaSoma += e.eficiencia_transporte || 0;
        naviosComDados[e.shipName].eficienciaCount += 1;
      }
    });

    // Calcula médias e formata
    return Object.values(naviosComDados)
      .filter(n => n.eficienciaCount > 0 && n.deterioracaoCount > 0)
      .map(n => ({
        navio: n.navio.length > 15 ? n.navio.substring(0, 15) + '...' : n.navio,
        deterioracao: (n.deterioracaoSoma / n.deterioracaoCount) * 1000, // Para melhor visualização
        eficiencia: n.eficienciaSoma / n.eficienciaCount,
        consumo: n.consumoMedio
      }))
      .sort((a, b) => b.deterioracao - a.deterioracao)
      ;
  }, [dadosDeterioracaoFiltrados, dadosEficienciaFiltrados]);

  // Dados para gráfico de consumo extra por navio
  const dadosConsumoExtra = useMemo(() => {
    return dadosDeterioracaoFiltrados
      .filter(d => d.aumento_percentual_periodo > 0)
      .map(d => {
        const consumoBase = d.consumo_medio / (1 + d.aumento_percentual_periodo / 100);
        const consumoExtra = d.consumo_medio - consumoBase;
        const gastoExtra = consumoExtra * (d.distancia_total_nm || 0) * cotacaoCombustivel;
        
        return {
          navio: d.navio,
          consumoExtra: consumoExtra.toFixed(4),
          gastoExtra: gastoExtra / 1000000, // Em milhões
          aumentoPercentual: d.aumento_percentual_periodo
        };
      })
      .sort((a, b) => b.gastoExtra - a.gastoExtra)
      ;
  }, [dadosDeterioracaoFiltrados, cotacaoCombustivel]);

  if (carregando) {
    return (
      <div className="h-full overflow-y-auto space-y-6 bg-slate-50 p-6 rounded-2xl shadow-sm pb-20">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="h-full overflow-y-auto space-y-6 bg-slate-50 p-6 rounded-2xl shadow-sm pb-20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">Erro ao carregar dados</p>
            <p className="text-sm text-slate-500 mt-2">{erro}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 bg-slate-50 p-6 rounded-2xl shadow-sm pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Operacional</h2>
          <p className="text-slate-500">Monitoramento de bioincrustação e eficiência da frota Transpetro.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-400">
            Cotação: R$ {cotacaoCombustivel.toLocaleString('pt-BR')}/ton
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterBadge icon={Filter} label="Classe">
              <Select
                value={classeFiltro}
                onChange={(e) => {
                  setClasseFiltro(e.target.value);
                  setNavioFiltro("todos");
                }}
                options={
                  <>
                    <option value="todas">Todas as Classes</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </>
                }
              />
            </FilterBadge>

            <FilterBadge icon={Ship} label="Navio">
              <Select
                value={navioFiltro}
                onChange={(e) => setNavioFiltro(e.target.value)}
                options={
                  <>
                    <option value="todos">Todos os Navios</option>
                    {naviosDaClasse.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </>
                }
              />
            </FilterBadge>

            <FilterBadge icon={Calendar} label="Início">
              <DateInput value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </FilterBadge>

            <FilterBadge icon={Calendar} label="Fim">
              <DateInput value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </FilterBadge>
          </div>
        </CardContent>
      </Card>

      {/* KPIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frota Monitorada</CardTitle>
            <Ship className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalNavios}</div>
            <p className="text-xs text-slate-500">Navios com dados de deterioração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.alertasCriticos}</div>
            <p className="text-xs text-slate-500">Aumento de consumo &gt;50%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Extra Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R$ {(kpis.gastoExtraMensal / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-slate-500">Por deterioração de casco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pegada de Carbono</CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.co2Extra > 1000 ? `${(kpis.co2Extra / 1000).toFixed(1)}k` : kpis.co2Extra.toFixed(0)} ton
            </div>
            <p className="text-xs text-slate-500">CO2 extra mensal (estimado)</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* GRÁFICO DE LINHA - DETERIORAÇÃO AO LONGO DO TEMPO */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Evolução da Deterioração</CardTitle>
            <CardDescription>Taxa de deterioração mensal por navio ao longo dos períodos.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div style={{ width: '100%', height: 350 }}>
              {dadosDeterioracaoLinha.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={dadosDeterioracaoLinha} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodo"
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Taxa (x1000)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  {dadosDeterioracaoTemporal.map((navio, idx) => (
                    <Line
                      key={navio.navio}
                      type="monotone"
                      dataKey={navio.navio}
                      name={navio.navio}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO DE BARRAS - CONSUMO EXTRA POR NAVIO */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Gasto Extra por Navio</CardTitle>
            <CardDescription>Impacto financeiro da deterioração (em milhões R$).</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 350 }}>
              {dadosConsumoExtra.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={dadosConsumoExtra} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="navio" 
                    stroke="#888888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value.toFixed(1)}M`}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`R$ ${value.toFixed(2)}M`, 'Gasto Extra']}
                  />
                  <Bar dataKey="gastoExtra" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRID INFERIOR */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* GRÁFICO DE DISPERSÃO - EFICIÊNCIA VS DETERIORAÇÃO */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Eficiência vs Deterioração</CardTitle>
            <CardDescription>Relação entre eficiência energética e taxa de deterioração por navio.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              {dadosEficienciaVsDeterioracao.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart data={dadosEficienciaVsDeterioracao} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="navio"
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: 'Eficiência', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      label={{ value: 'Deterioração (x1000)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name) => [
                        name === 'eficiencia' ? value.toFixed(2) : value.toFixed(4),
                        name === 'deterioracao' ? 'Deterioração' : 'Eficiência'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="eficiencia" fill="#10b981" radius={[4, 4, 0, 0]} name="Eficiência" />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="deterioracao" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Deterioração"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LISTA DE ALERTAS CRÍTICOS */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Alertas Críticos</CardTitle>
            <CardDescription>Navios com maior deterioração e impacto financeiro.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosDeterioracaoFiltrados
                .filter(d => d.aumento_percentual_periodo > 50)
                .sort((a, b) => b.aumento_percentual_periodo - a.aumento_percentual_periodo)
                
                .map((navio, idx) => {
                  const consumoBase = navio.consumo_medio / (1 + navio.aumento_percentual_periodo / 100);
                  const consumoExtra = navio.consumo_medio - consumoBase;
                  const gastoExtra = consumoExtra * (navio.distancia_total_nm || 0) * cotacaoCombustivel;
                  
                  return (
                    <div key={idx} className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="ml-4 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{navio.navio}</p>
                        <p className="text-xs text-slate-500">
                          Aumento: +{navio.aumento_percentual_periodo.toFixed(1)}%
                        </p>
                        <p className="text-xs text-amber-600 font-medium">
                          Gasto extra: R$ {(gastoExtra / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                  );
                })}
              {dadosDeterioracaoFiltrados.filter(d => d.aumento_percentual_periodo > 50).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum alerta crítico no momento</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICO DE ÁREA - CONSUMO MÉDIO AO LONGO DO TEMPO */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Consumo Médio</CardTitle>
          <CardDescription>Consumo médio por navio ao longo dos períodos de deterioração.</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            {dadosConsumoTemporal.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={dadosConsumoTemporal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    {dadosDeterioracaoTemporal.map((navio, idx) => (
                      <linearGradient key={navio.navio} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodo"
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Consumo (ton/nm)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => value ? value.toFixed(4) : 'N/A'}
                  />
                  <Legend />
                  {dadosDeterioracaoTemporal.map((navio, idx) => (
                    <Area
                      key={navio.navio}
                      type="monotone"
                      dataKey={navio.navio}
                      name={navio.navio}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={`url(#color${idx})`}
                      strokeWidth={2}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}