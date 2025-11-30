// src/components/GraficoConsumoPorPorte.jsx
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficoConsumoPorPorte({ dados }) {
	if (!dados || dados.length === 0) return null;

	const grupos = {};

	dados.forEach((d) => {
		const faixa =
			d["Porte Bruto"] < 20000
				? "Pequeno"
				: d["Porte Bruto"] < 80000
				? "Médio"
				: "Grande";

		if (!grupos[faixa]) grupos[faixa] = 0;
		grupos[faixa] += d.combustivel_total;
	});

	const labels = Object.keys(grupos);
	const valores = Object.values(grupos);

	const data = {
		labels,
		datasets: [
			{
				label: "Consumo Total (litros)",
				data: valores,
				backgroundColor: "#10b981",
			},
		],
	};

	return (
		<div className="card">
			<h2>Consumo por Porte do Navio</h2>
			<Bar data={data} />
		</div>
	);
}
