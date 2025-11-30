import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { 
  Ship, 
  AlertTriangle, 
  Leaf, 
  TrendingUp, 
  Droplets, 
  Activity 
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

export default function DashboardFrota({ kpis, intervalosNavio, intervalosClasse, tiposIncrustacao }) {
  
  // 1. LÓGICA DE DADOS INTELIGENTE
  // Se os dados vierem da API (props), usa eles.
  // Se vierem vazios ou null, usa o MOCK (assim o gráfico nunca quebra).

  const dadosNavio = (intervalosNavio && intervalosNavio.length > 0)
    ? intervalosNavio.slice(0, 10).map((n) => ({ name: n.Embarcação || "Navio X", dias: n.mediana_dias_entre_iws }))
    : MOCK_NAVIOS;

  const dadosPizza = (tiposIncrustacao?.embarcacao && tiposIncrustacao.embarcacao.length > 0)
    ? tiposIncrustacao.embarcacao.map((t, idx) => ({ name: t.tipo, value: t.quantidade, color: COLORS[idx % COLORS.length] }))
    : MOCK_PIZZA.map((t, idx) => ({ ...t, color: COLORS[idx % COLORS.length] }));

  const dadosClasse = (intervalosClasse && intervalosClasse.length > 0)
    ? intervalosClasse.map((c) => ({ name: c.classe, mediana: c.media_mediana_dias_entre_iws }))
    : MOCK_RADAR;

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
             Dados atualizados: Hoje
           </span>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frota Monitorada</CardTitle>
            <Ship className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.total_navios || 33}</div>
            <p className="text-xs text-slate-500">+2 navios integrados este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis?.alertas_criticos || 2}</div>
            <p className="text-xs text-slate-500">Acima do limite NORMAM 401</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Financeiro</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {kpis?.desperdicio_estimado || "450k"}</div>
            <p className="text-xs text-slate-500">Perda mensal por arrasto (estimada)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pegada de Carbono</CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.co2_extra || "1.2k"} ton</div>
            <p className="text-xs text-slate-500">Emissões evitáveis de CO2</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* GRÁFICO DE BARRAS (NAVIOS) */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Performance por Navio</CardTitle>
            <CardDescription>Média de dias entre inspeções (Quanto maior, melhor a proteção).</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Altura fixa é CRUCIAL aqui */}
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={dadosNavio} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}d`}
                  />
                  <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="dias" fill="#004aad" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO DE PIZZA (TIPOS) */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Tipos de Incrustação</CardTitle>
            <CardDescription>Distribuição das ocorrências reportadas (IWS).</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                  <PieChart>
                      <Pie
                          data={dadosPizza}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                      >
                          {dadosPizza.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRID INFERIOR */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* RADAR CHART */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Média por Classe</CardTitle>
            <CardDescription>Comparativo de eficiência entre tipos de navio.</CardDescription>
          </CardHeader>
          <CardContent>
             <div style={{ width: '100%', height: 300 }}>
               <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dadosClasse}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 800]} tick={false} axisLine={false} />
                      <Radar
                          name="Dias Médios"
                          dataKey="mediana"
                          stroke="#004aad"
                          fill="#004aad"
                          fillOpacity={0.3}
                      />
                      <Tooltip />
                  </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* LISTA DE ALERTAS */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Alertas Recentes</CardTitle>
            <CardDescription>Navios que requerem atenção imediata.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Carla Silva (Aframax)</p>
                  <p className="text-sm text-slate-500">Desvio de consumo: +12%</p>
                </div>
                <div className="ml-auto font-medium text-red-600 text-sm">Crítico</div>
              </div>

              <div className="flex items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Activity className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Henrique Alves (Suezmax)</p>
                  <p className="text-sm text-slate-500">Parado em águas quentes há 15 dias.</p>
                </div>
                <div className="ml-auto font-medium text-amber-600 text-sm">Atenção</div>
              </div>
              
               <div className="flex items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Anita Garibaldi (Suezmax)</p>
                  <p className="text-sm text-slate-500">Limpeza de hélice agendada.</p>
                </div>
                <div className="ml-auto font-medium text-blue-600 text-sm">Agendado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}