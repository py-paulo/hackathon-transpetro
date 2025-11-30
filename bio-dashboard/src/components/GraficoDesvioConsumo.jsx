// src/components/GraficoDesvioConsumo.jsx
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficoDesvioConsumo({ dados }) {
	if (!dados || dados.length === 0) return null;

	const labels = dados.map((d) => d.NOME_NORMALIZADO);
	const valores = dados.map((d) => d.desvio_consumo);

	const data = {
		labels,
		datasets: [
			{
				label: "Desvio de Consumo (litros)",
				data: valores,
				backgroundColor: valores.map((v) =>
					v > 0 ? "#ef4444" : "#3b82f6"
				),
			},
		],
	};

	return (
		<div className="card">
			<h2>Desvio de Consumo por Navio</h2>
			<Bar data={data} />
		</div>
	);
}
