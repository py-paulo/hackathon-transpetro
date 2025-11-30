// src/components/GraficosDashboard.jsx
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Radar,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
} from "recharts";

const CORES = [
	"#0ea5e9",
	"#22c55e",
	"#eab308",
	"#f97316",
	"#ec4899",
	"#8b5cf6",
	"#6366f1",
	"#14b8a6",
	"#f97373",
];

// normaliza string de tipo de incrustação para evitar duplicados
// Ex.: "CRACA + MOLE" e "MOLE , CRACA" viram "CRACA + MOLE"
function canonicalTipo(valor) {
	if (!valor) return "DESCONHECIDO";
	const tokens = String(valor)
		.toUpperCase()
		.replace(/\s+/g, " ")
		.trim()
		.split(/[,+]/) // separa por vírgula ou +
		.map((t) => t.trim())
		.filter(Boolean)
		.sort();

	return tokens.join(" + ") || "DESCONHECIDO";
}

// recebe array bruto e devolve agregação por tipo já normalizado
function agregarTipos(listaBruta) {
	const mapa = new Map();

	for (const item of listaBruta || []) {
		const tipoCanonico = canonicalTipo(item.tipo);
		const qtd = Number(item.quantidade || 0);
		mapa.set(tipoCanonico, (mapa.get(tipoCanonico) || 0) + qtd);
	}

	return Array.from(mapa.entries()).map(([tipo, quantidade]) => ({
		tipo,
		quantidade,
	}));
}

export default function GraficosDashboard({
	intervalosNavio,
	intervalosClasse,
	tiposIncrustacao,
}) {
	// -----------------------------
	// 1) GRÁFICO DE LINHA – NAVIO
	// -----------------------------
	const dadosLinha = (intervalosNavio || [])
		.filter((n) => n.Embarcação && n.mediana_dias_entre_iws != null)
		.sort(
			(a, b) =>
				(a.mediana_dias_entre_iws || 0) -
				(b.mediana_dias_entre_iws || 0)
		)
		.slice(0, 20)
		.map((n, idx) => ({
			navio: n.Embarcação,
			mediana: n.mediana_dias_entre_iws,
			indice: idx + 1,
		}));

	// -----------------------------
	// 2) RADAR – POR CLASSE
	// -----------------------------
	const dadosRadar = (intervalosClasse || []).map((c) => ({
		classe: c.classe,
		mediana: c.media_mediana_dias_entre_iws,
		min: c.min_mediana_dias_entre_iws,
		max: c.max_mediana_dias_entre_iws,
	}));

	// -----------------------------
	// 3) PIZZA – TIPOS DE INCRUSTAÇÃO
	// -----------------------------

	// garante que embarcacao sempre seja um array
	let listaBruta = [];
	const fonte = tiposIncrustacao?.embarcacao;

	if (Array.isArray(fonte)) {
		listaBruta = fonte;
	} else if (fonte && typeof fonte === "object") {
		// caso venha como objeto/dicionário
		listaBruta = Object.values(fonte);
	}

	// agrega e normaliza tipos
	let dadosPizza = agregarTipos(listaBruta);

	// ordena por quantidade desc e pega top 10
	dadosPizza = dadosPizza
		.sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0))
		.slice(0, 10);

	const totalIncrustacoes = dadosPizza.reduce(
		(acc, d) => acc + (d.quantidade || 0),
		0
	);

	return (
		<div style={{ display: "grid", gap: 24 }}>
			{/* LINHA – MEDIANA ENTRE IWS POR NAVIO */}
			<div className="card">
				<h2>Intervalo entre IWS por Navio (Top 20)</h2>
				<p
					style={{
						marginTop: -4,
						marginBottom: 16,
						color: "#64748b",
					}}
				>
					Navios com mediana de dias entre inspeções. Quanto maior,
					maior o risco de bioincrustação se acumulando entre IWS.
				</p>
				<div style={{ width: "100%", height: 320 }}>
					<ResponsiveContainer>
						<LineChart data={dadosLinha}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="navio" tick={{ fontSize: 10 }} />
							<YAxis />
							<Tooltip />
							<Legend />
							<Line
								type="monotone"
								dataKey="mediana"
								name="Mediana de dias entre IWS"
								stroke="#0ea5e9"
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* INTERVALOS POR CLASSE – GRÁFICO HORIZONTAL */}
			<div className="card">
				<h2>Intervalos entre Inspeções por Classe</h2>
				<p
					style={{
						marginTop: -4,
						marginBottom: 16,
						color: "#64748b",
					}}
				>
					Comparação entre classes pela mediana, mínimo e máximo de
					dias entre IWS.
				</p>

				<div style={{ width: "100%", height: 350 }}>
					<ResponsiveContainer>
						<BarChart
							data={dadosRadar}
							layout="vertical"
							margin={{
								top: 20,
								right: 30,
								left: 80,
								bottom: 20,
							}}
						>
							<CartesianGrid strokeDasharray="3 3" />

							<XAxis type="number" />
							<YAxis dataKey="classe" type="category" />

							<Tooltip />
							<Legend />

							<Bar dataKey="min" name="Mínimo" fill="#22c55e" />
							<Bar
								dataKey="mediana"
								name="Mediana"
								fill="#0ea5e9"
							/>
							<Bar dataKey="max" name="Máximo" fill="#f97316" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* PIZZA – TIPOS DE INCRUSTAÇÃO (NORMALIZADOS) */}
			<div className="card">
				<h2>Distribuição dos Tipos de Incrustação (normalizado)</h2>
				<p
					style={{
						marginTop: -4,
						marginBottom: 16,
						color: "#64748b",
					}}
				>
					Combina variações como {"“CRACA + MOLE”"} e{" "}
					{"“MOLE + CRACA”"} em um mesmo agrupamento. Total de
					registros: <strong>{totalIncrustacoes}</strong>.
				</p>
				<div style={{ width: "100%", height: 340 }}>
					<ResponsiveContainer>
						<PieChart>
							<Pie
								data={dadosPizza}
								dataKey="quantidade"
								nameKey="tipo"
								cx="50%"
								cy="50%"
								outerRadius={110}
								labelLine={false}
								label={(entry) =>
									`${entry.tipo} (${(
										((entry.quantidade || 0) /
											(totalIncrustacoes || 1)) *
										100
									).toFixed(1)}%)`
								}
							>
								{dadosPizza.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={CORES[index % CORES.length]}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
