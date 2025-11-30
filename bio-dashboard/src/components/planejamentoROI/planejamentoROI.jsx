import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend
} from "recharts";
import { 
  Bot, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  FileText
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 pb-4 ${className}`}>
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

const INSIGHTS_IA = [
  {
    id: 1,
    navio: "Anita Garibaldi",
    tipo: "crítico",
    mensagem: "Detectamos aumento de 12% no consumo após 10 dias de ancoragem em Santos (águas quentes).",
    recomendacao: "Limpeza de hélice recomendada imediatamente.",
    confianca: 98
  },
  {
    id: 2,
    navio: "Dragão do Mar",
    tipo: "alerta",
    mensagem: "Tendência de incrustação leve no casco plano. Perda de velocidade de 0.5 nós.",
    recomendacao: "Monitorar por mais 15 dias antes de agendar IWS.",
    confianca: 85
  },
];

export default function PlanejamentoROI() {
  
  // --- ESTADOS DO SIMULADOR ---
  // Valores iniciais para a simulação
  const [precoCombustivel, setPrecoCombustivel] = useState(600); // USD por tonelada
  const [custoLimpeza, setCustoLimpeza] = useState(45000); // USD
  const [desperdicioDiario, setDesperdicioDiario] = useState(3.5); // Toneladas/dia
  
  // --- CÁLCULOS FINANCEIROS (MÁGICA DO ROI) ---
  
  // 1. Custo do Desperdício por dia ($)
  const perdaDiariaUSD = precoCombustivel * desperdicioDiario;

  // 2. Ponto de Equilíbrio (Dias): Quando o custo acumulado do desperdício empata com a limpeza
  const diasBreakEven = Math.ceil(custoLimpeza / perdaDiariaUSD);

  // 3. Gerar dados para o gráfico (Projeção de 60 dias)
  const dadosGrafico = useMemo(() => {
    const dados = [];
    for (let dia = 0; dia <= 60; dia += 5) {
      dados.push({
        dia: `Dia ${dia}`,
        custoLimpeza: custoLimpeza, // Linha reta (custo fixo)
        perdaAcumulada: perdaDiariaUSD * dia, // Linha diagonal (crescente)
      });
    }
    return dados;
  }, [custoLimpeza, perdaDiariaUSD]);

  // Formatador de Moeda
  const formatUSD = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 rounded-2xl shadow-sm space-y-6 pb-24">
      
      {/* CABEÇALHO */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-2">
           <Bot className="h-8 w-8 text-blue-600" /> Inteligência & Decisão
        </h2>
        <p className="text-slate-500">
          Cruzamento de dados operacionais com modelos financeiros para otimizar manutenções.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* COLUNA 1: FEED DE INSIGHTS (IA) */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-slate-500" /> Parâmetros de Simulação
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Preço Combustível (USD/ton)</label>
                        <div className="relative mt-1">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="number" 
                                value={precoCombustivel}
                                onChange={(e) => setPrecoCombustivel(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Custo Estimado Limpeza (USD)</label>
                        <div className="relative mt-1">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="number" 
                                value={custoLimpeza}
                                onChange={(e) => setCustoLimpeza(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Desperdício Atual (Tons/dia)</label>
                        <div className="relative mt-1">
                            <TrendingUp className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="number" 
                                step="0.1"
                                value={desperdicioDiario}
                                onChange={(e) => setDesperdicioDiario(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Bot className="h-5 w-5" /> Insights do Gemini
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {INSIGHTS_IA.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800 text-sm">{item.navio}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    item.tipo === 'crítico' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {item.tipo}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                                {item.mensagem}
                            </p>
                            <div className="bg-slate-50 p-2 rounded text-xs text-slate-700 border border-slate-100">
                                <strong>Recomendação:</strong> {item.recomendacao}
                            </div>
                            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                                <Bot className="h-3 w-3" /> Confiança da IA: {item.confianca}%
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* COLUNA 2: GRÁFICO E RESULTADOS (ROI) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* GRÁFICO DE LINHAS CRUZADAS */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Curva de Decisão (Break-even)</CardTitle>
                    <p className="text-sm text-slate-500">
                        Comparativo entre realizar o investimento da limpeza agora vs. acumular prejuízo de combustível.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                                <Tooltip 
                                    formatter={(value) => formatUSD(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="custoLimpeza" 
                                    name="Custo da Limpeza (Investimento)" 
                                    stroke="#10b981" 
                                    strokeWidth={3} 
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="perdaAcumulada" 
                                    name="Prejuízo Acumulado (Combustível)" 
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                />

                                <ReferenceLine x={`Dia ${Math.round(diasBreakEven/5)*5}`} stroke="black" label="Ponto de Decisão" strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* PAINEL DE CONCLUSÃO */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className={`border-l-4 ${diasBreakEven < 30 ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${diasBreakEven < 30 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                {diasBreakEven < 30 ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">Payback em {diasBreakEven} dias</h4>
                                <p className="text-xs text-slate-500">Retorno sobre investimento</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                            Se limpar hoje, em <strong>{diasBreakEven} dias</strong> a economia de combustível paga o serviço. 
                            {diasBreakEven < 30 
                                ? " Cenário altamente favorável para intervenção imediata." 
                                : " Avaliar agendamento junto com outras manutenções."}
                        </p>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center bg-slate-50 border-dashed border-2">
                    <CardContent className="pt-6 text-center w-full">
                         <h4 className="font-semibold text-slate-700 mb-4">Ação Recomendada</h4>
                         <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg">
                            <FileText className="h-5 w-5" />
                            Gerar Ordem de Serviço
                         </button>
                         <p className="text-xs text-slate-400 mt-2">Envia solicitação direta para o SAP da Transpetro.</p>
                    </CardContent>
                </Card>
            </div>

        </div>
      </div>
    </div>
  );
}