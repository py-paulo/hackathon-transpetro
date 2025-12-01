import { MapContainer, TileLayer, Polyline, Tooltip, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
import { Map, Filter, Calendar, Ship } from "lucide-react";

const ZONAS_MAPA = [
    // 1. ZONAS DE ALTO RISCO (Vermelho - Sujeira)
    { 
        id: 1, 
        tipo: "risk", 
        nome: "Porto de Santos (SP)", 
        lat: -24.00, lng: -46.30, 
        raio: 35000, 
        cor: "#ef4444", 
        motivo: "Água quente + Eutrofização (Nutrientes)"
    },
    { 
        id: 2, 
        tipo: "risk",
        nome: "Baía de Guanabara (RJ)", 
        lat: -22.85, lng: -43.15, 
        raio: 25000, 
        cor: "#ef4444", 
        motivo: "Baixa hidrodinâmica + Poluição"
    },
    { 
        id: 3, 
        tipo: "risk",
        nome: "Zona Tropical (Corrente do Brasil)", 
        lat: -14.0, lng: -36.0, 
        raio: 300000, 
        cor: "#f59e0b", // Laranja
        motivo: "Temperatura da superfície > 27°C"
    },

    // 2. ZONAS DE ÁGUA DOCE (Ciano - Limpeza Natural/Choque Osmótico)
    { 
        id: 4, 
        tipo: "freshwater", 
        nome: "Delta do Amazonas (Macapá)", 
        lat: 0.05, lng: -49.5, 
        raio: 150000, 
        cor: "#06b6d4", 
        motivo: "Choque Osmótico (Mata organismos marinhos)"
    },
    { 
        id: 5, 
        tipo: "freshwater",
        nome: "Hidrovia Tietê/Paraná", 
        lat: -22.5, lng: -52.0, 
        raio: 80000, 
        cor: "#06b6d4", 
        motivo: "Navegação em Água Doce"
    },

    // 3. ZONAS AMBIENTAIS SENSÍVEIS (Roxo - Proibido Limpar)
    { 
        id: 6, 
        tipo: "sensitive", 
        nome: "Fernando de Noronha (APA)", 
        lat: -3.85, lng: -32.42, 
        raio: 40000, 
        cor: "#9333ea", 
        motivo: "PROIBIDO LIMPEZA (Risco de Espécie Invasora)"
    },
    { 
        id: 7, 
        tipo: "sensitive",
        nome: "Banco dos Abrolhos", 
        lat: -17.9, lng: -38.7, 
        raio: 60000, 
        cor: "#9333ea", 
        motivo: "Santuário de Baleias e Corais"
    }
];

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
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

export default function MapaAIS({ trilhas = [], naviosResumo = [] }) {
    const [classeFiltro, setClasseFiltro] = useState("todas");
    const [navioFiltro, setNavioFiltro] = useState("todos");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const classes = useMemo(() => {
        const set = new Set();
        naviosResumo.forEach((n) => n.Classe && set.add(n.Classe));
        return Array.from(set);
    }, [naviosResumo]);

    const naviosDaClasse = useMemo(() => {
        const filtro =
            classeFiltro === "todas"
                ? naviosResumo
                : naviosResumo.filter((n) => n.Classe === classeFiltro);
        return filtro.map((n) => n["Nome do navio"]);
    }, [classeFiltro, naviosResumo]);

    const trilhasFiltradas = useMemo(() => {
        let dados = trilhas;

        if (classeFiltro !== "todas") {
            dados = dados.filter((p) => p.classe === classeFiltro);
        }

        if (navioFiltro !== "todos") {
            dados = dados.filter((p) => p.nome_navio === navioFiltro);
        }

        if (dataInicio) {
            dados = dados.filter((p) => p.datahora >= dataInicio);
        }
        if (dataFim) {
            dados = dados.filter((p) => p.datahora <= `${dataFim} 23:59:59`);
        }

        const grupos = {};
        dados.forEach((p) => {
            if (!grupos[p.nome_navio]) grupos[p.nome_navio] = [];
            grupos[p.nome_navio].push(p);
        });

        Object.values(grupos).forEach((lista) =>
            lista.sort((a, b) => (a.datahora > b.datahora ? 1 : -1))
        );

        return grupos;
    }, [trilhas, classeFiltro, navioFiltro, dataInicio, dataFim]);

    const center = [-15, -50]; // Centro ajustado para mostrar Brasil + Amazônia

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            {/* Header e Filtros */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Map className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rota Inteligente & Risco Biológico</h2>
                        <p className="text-sm text-slate-500">
                            Rastreamento AIS sobreposto com zonas de influência biológica (Risco, Limpeza e Proteção).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
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
            </div>

            {/* Mapa Leaflet */}
            <div className="flex-grow relative z-0 h-[500px] w-full bg-slate-100">
                <MapContainer
                    center={center}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {/* 1. ZONAS DE RISCO (Desenhadas ANTES para ficarem no fundo) */}
                    {ZONAS_MAPA.map((zona) => (
                        <Circle
                            key={zona.id}
                            center={[zona.lat, zona.lng]}
                            radius={zona.raio}
                            pathOptions={{ 
                                color: zona.cor, 
                                fillColor: zona.cor, 
                                // Água doce destaca mais (0.4), outros mais sutis (0.2)
                                fillOpacity: zona.tipo === 'freshwater' ? 0.35 : 0.2, 
                                stroke: zona.tipo === 'sensitive', // Borda só se for sensível
                                dashArray: zona.tipo === 'sensitive' ? '5, 10' : null // Pontilhado
                            }}
                        >
                            <Tooltip direction="top" opacity={1}>
                                <div className="text-center">
                                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full text-white ${
                                        zona.tipo === 'risk' ? 'bg-red-500' : 
                                        zona.tipo === 'freshwater' ? 'bg-cyan-600' : 'bg-purple-600'
                                    }`}>
                                        {zona.tipo === 'risk' ? 'Alto Risco Bio' : 
                                         zona.tipo === 'freshwater' ? 'Limpeza Natural' : 'Área Protegida'}
                                    </span>
                                    <br/>
                                    <strong className="text-sm mt-1 block">{zona.nome}</strong>
                                    <span className="text-xs text-slate-500 italic">{zona.motivo}</span>
                                </div>
                            </Tooltip>
                        </Circle>
                    ))}

                    {Object.entries(trilhasFiltradas).map(([nome, pontos], idx) => {
                        const path = pontos.map((p) => [p.lat, p.lng]);
                        const color = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"][idx % 5];

                        return (
                            <Polyline
                                key={nome}
                                positions={path}
                                pathOptions={{ color, weight: 3, opacity: 0.9 }}
                            >
                                <Tooltip sticky direction="top" offset={[0, -10]}>
                                    <div className="text-sm font-bold">{nome}</div>
                                </Tooltip>
                            </Polyline>
                        );
                    })}
                </MapContainer>
                
                <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-slate-200 shadow-xl text-xs z-[1000]">
                    <p className="font-bold text-slate-800 mb-2 border-b pb-1">Legenda Operacional</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-1 bg-blue-500 rounded-full"></span>
                            <span>Rota Realizada (AIS)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500/50 rounded-full"></span>
                            <span className="text-red-700 font-medium">Zona de Incrustação (Portos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-cyan-500/50 rounded-full"></span>
                            <span className="text-cyan-700 font-medium">Choque Osmótico (Água Doce)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 border border-purple-500 bg-purple-500/20 rounded-full border-dashed"></span>
                            <span className="text-purple-700 font-medium">Área Ambiental Sensível</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}