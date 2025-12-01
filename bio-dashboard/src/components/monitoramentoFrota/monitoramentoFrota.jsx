import React, { useState } from "react";
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

// --- MOCK DATA PARA O DETALHE (Speed vs Power) ---
const MOCK_SPEED_POWER = [
  { speed: 10, powerTeorica: 2000, powerReal: 2100 },
  { speed: 11, powerTeorica: 2500, powerReal: 2700 },
  { speed: 12, powerTeorica: 3200, powerReal: 3600 }, // Desvio começa aqui
  { speed: 13, powerTeorica: 4000, powerReal: 4600 },
  { speed: 14, powerTeorica: 5000, powerReal: 5900 },
  { speed: 15, powerTeorica: 6200, powerReal: 7500 },
];

// --- SUB-COMPONENTE: DETALHES DO NAVIO (Drill-down) ---
const DetalhesNavio = ({ navio }) => {
    if (!navio) return null;

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-4 duration-300">
            <div className="grid lg:grid-cols-2 gap-6">
                
                {/* 1. Gráfico Speed x Power */}
                <Card>
                    <div className="p-4 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" /> Curva de Performance (Speed vs Power)
                        </h4>
                        <p className="text-xs text-slate-500">Comparativo: Curva de Teste (Limpo) vs. Medição Atual</p>
                    </div>
                    <div className="p-4 h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_SPEED_POWER}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                                <XAxis dataKey="speed" label={{ value: 'Velocidade (kn)', position: 'insideBottom', offset: -5, fontSize: 10 }} fontSize={12} stroke="#94a3b8"/>
                                <YAxis label={{ value: 'Potência (kW)', angle: -90, position: 'insideLeft', fontSize: 10 }} fontSize={12} stroke="#94a3b8"/>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                                <Legend verticalAlign="top" height={36}/>
                                <Line type="monotone" dataKey="powerTeorica" name="Ref. Casco Limpo" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="powerReal" name="Medição Atual (Sujo)" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Heatmap do Casco (Conceitual) */}
                <Card>
                    <div className="p-4 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-amber-600" /> Condição do Casco (Heatmap)
                        </h4>
                        <p className="text-xs text-slate-500">Áreas com maior probabilidade de bioincrustação.</p>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center h-[250px] relative bg-blue-50/30">
                        {/* Desenho simples de um navio usando CSS/SVG */}
                        <svg viewBox="0 0 400 120" className="w-full h-full drop-shadow-md">
                            {/* Casco */}
                            <path d="M 20,40 Q 20,100 60,100 L 340,100 Q 380,100 380,40 L 20,40" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                            {/* Linha D'água */}
                            <line x1="10" y1="50" x2="390" y2="50" stroke="#3b82f6" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" />
                            
                            {/* Áreas de Incrustação (Heatmap) */}
                            {/* Hélice (Crítico) */}
                            <circle cx="45" cy="85" r="15" fill="rgba(239, 68, 68, 0.6)" className="animate-pulse" />
                            <text x="45" y="85" fontSize="10" fill="white" textAnchor="middle" dy="3">Hélice</text>
                            
                            {/* Fundo Chato (Médio) */}
                            <rect x="150" y="85" width="100" height="15" fill="rgba(245, 158, 11, 0.4)" rx="5" />
                            
                            {/* Linha d'agua (Alto) */}
                            <rect x="80" y="45" width="240" height="10" fill="rgba(239, 68, 68, 0.3)" />
                        </svg>
                        
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Crítico</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Atenção</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full"></div> Limpo</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function MonitoramentoFrota({ trilhas = [], naviosResumo = [] }) {
    
    // Estado para controlar qual navio está expandido na lista
    const [navioExpandido, setNavioExpandido] = useState(null);

    const toggleNavio = (nome) => {
        if (navioExpandido === nome) {
            setNavioExpandido(null);
        } else {
            setNavioExpandido(nome);
        }
    };

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
                <MapaAIS trilhas={trilhas} naviosResumo={naviosResumo} />
            </div>

            {/* SEÇÃO 2: LISTA DE NAVIOS COM DRILL-DOWN */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Status da Frota (Tempo Real)</h3>
                
                <div className="grid gap-3">
                    {naviosResumo.slice(0, 10).map((navio, idx) => {
                        const isExpanded = navioExpandido === navio["Nome do navio"];
                        
                        // Mock de status aleatório para demo
                        const status = idx % 3 === 0 ? "danger" : idx % 2 === 0 ? "warning" : "success";
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
                                            <p className="font-bold text-slate-800">{navio["Nome do navio"]}</p>
                                            <p className="text-xs text-slate-500">{navio.Classe} • {navio.Tipo}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 text-sm text-slate-600 hidden md:flex">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400">Velocidade</p>
                                            <p className="font-mono font-semibold">{navio.velocidade_media ? navio.velocidade_media.toFixed(1) : 0} kn</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-400">Consumo</p>
                                            <p className="font-mono font-semibold">{navio.combustivel_total ? (navio.combustivel_total/100).toFixed(1) : 0} t/dia</p>
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
                                        <DetalhesNavio navio={navio} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}