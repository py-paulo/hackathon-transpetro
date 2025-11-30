import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficoTimelineNavio({ dadosFiltrados = [] }) {
	// Proteção absoluta contra undefined
	if (!Array.isArray(dadosFiltrados) || dadosFiltrados.length === 0) {
		return (
			<div className="card">
				<h2>Linha do Tempo do Navio</h2>
				<p>Nenhum dado disponível.</p>
			</div>
		);
	}

	// Ordenar por data
	const ordenado = [...dadosFiltrados].sort((a, b) => {
		return new Date(a.data) - new Date(b.data);
	});

	const labels = ordenado.map((d) => d.data);
	const horas = ordenado.map((d) => d.horas_previstas || d.horas_dia || 0);

	const data = {
		labels,
		datasets: [
			{
				label: "Horas por dia",
				data: horas,
				borderColor: "#2563eb",
				backgroundColor: "rgba(37, 99, 235, 0.4)",
				tension: 0.3,
			},
		],
	};

	return (
		<div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
			<h2 style={{ textAlign: "center" }}>Linha do Tempo do Navio</h2>

			<div style={{ height: 300 }}>
				<Line
					data={data}
					options={{
						maintainAspectRatio: false,
						scales: {
							y: {
								title: {
									display: true,
									text: "Horas",
								},
							},
							x: {
								title: {
									display: true,
									text: "Data",
								},
							},
						},
						plugins: {
							legend: { display: false },
						},
					}}
				/>
			</div>
		</div>
	);
}
