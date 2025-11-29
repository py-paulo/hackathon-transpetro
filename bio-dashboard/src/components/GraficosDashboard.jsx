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

export default function GraficosDashboard({
	intervalosNavio,
	intervalosClasse,
	tiposIncrustacao,
}) {
	const cores = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

	// PieChart – tipos de incrustação
	const dadosPizza = (tiposIncrustacao?.embarcacao || []).map((t, idx) => ({
		name: t.tipo,
		value: t.quantidade,
		color: cores[idx % cores.length],
	}));

	// BarChart – média de intervalos por classe
	const dadosClasse = intervalosClasse.map((c) => ({
		classe: c.classe,
		mediana: c.media_mediana_dias_entre_iws,
	}));

	// LineChart – intervalos por navio
	const dadosLinha = intervalosNavio.map((n) => ({
		navio: n.Embarcação,
		mediana: n.mediana_dias_entre_iws,
	}));

	return (
		<div style={{ display: "grid", gap: 30 }}>
			<div className="card">
				<h2>Intervalo entre inspeções (por navio)</h2>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={dadosLinha}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="navio" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line
							type="monotone"
							dataKey="mediana"
							stroke="#2563eb"
							strokeWidth={3}
							activeDot={{ r: 8 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>

			<div className="card">
				<h2>Intervalos médios por classe</h2>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={dadosClasse}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="classe" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="mediana" fill="#10b981" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="card">
				<h2>Tipos mais comuns de incrustação</h2>
				<ResponsiveContainer width="100%" height={350}>
					<PieChart>
						<Pie
							data={dadosPizza}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={120}
							label
						>
							{dadosPizza.map((e, i) => (
								<Cell key={i} fill={e.color} />
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</div>

			<div className="card">
				<h2>Comparação geral entre classes</h2>
				<ResponsiveContainer width="100%" height={350}>
					<RadarChart
						cx="50%"
						cy="50%"
						outerRadius="80%"
						data={dadosClasse}
					>
						<PolarGrid />
						<PolarAngleAxis dataKey="classe" />
						<PolarRadiusAxis />
						<Radar
							name="Mediana"
							dataKey="mediana"
							stroke="#8b5cf6"
							fill="#8b5cf6"
							fillOpacity={0.6}
						/>
						<Tooltip />
					</RadarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
