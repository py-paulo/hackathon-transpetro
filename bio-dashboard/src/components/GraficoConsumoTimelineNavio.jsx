// src/components/GraficoConsumoTimelineNavio.jsx
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficoConsumoTimelineNavio({ eventos, navio }) {
	if (!navio) return null;

	const dados = eventos.filter((e) => e.NOME_NORMALIZADO === navio);

	if (dados.length === 0)
		return (
			<div className="card">
				<h2>Linha do Tempo de Consumo</h2>
				Nenhum dado disponível.
			</div>
		);

	const labels = dados.map((d) => d.dia);
	const valores = dados.map((d) => d.combustivel_total);

	const data = {
		labels,
		datasets: [
			{
				label: "Consumo Diário (L)",
				data: valores,
				borderColor: "#3b82f6",
				backgroundColor: "#93c5fd",
			},
		],
	};

	return (
		<div className="card">
			<h2>Linha do Tempo de Consumo</h2>
			<div style={{ height: 350 }}>
				<Line data={data} />
			</div>
		</div>
	);
}
