// src/components/GraficoConsumoPorClasse.jsx
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficoConsumoPorClasse({ dados }) {
	if (!dados || dados.length === 0) return null;

	const grupos = {};

	dados.forEach((d) => {
		if (!grupos[d.Classe]) grupos[d.Classe] = 0;
		grupos[d.Classe] += d.combustivel_total;
	});

	const labels = Object.keys(grupos);
	const valores = Object.values(grupos);

	const data = {
		labels,
		datasets: [
			{
				label: "Consumo Total (litros)",
				data: valores,
				backgroundColor: "#3b82f6",
			},
		],
	};

	return (
		<div className="card">
			<h2>Consumo por Classe</h2>
			<Bar data={data} />
		</div>
	);
}
