import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function GraficosAgua({ tempoRegiao, navioSelecionado }) {
	if (!tempoRegiao || tempoRegiao.length === 0) {
		return <div className="card">Nenhum dado encontrado.</div>;
	}

	// APLICA FILTRO
	const dados = navioSelecionado
		? tempoRegiao.filter((t) => t.navio === navioSelecionado)
		: tempoRegiao;

	// Água salgada/doce
	const aguaSalgada = dados
		.filter((t) => t.tipo_agua === "salgada")
		.reduce((acc, t) => acc + t.tempo_horas, 0);

	const aguaDoce = dados
		.filter((t) => t.tipo_agua === "doce")
		.reduce((acc, t) => acc + t.tempo_horas, 0);

	const pieData = {
		labels: ["Água Salgada", "Água Doce"],
		datasets: [
			{
				data: [aguaSalgada, aguaDoce],
				backgroundColor: ["#3b82f6", "#10b981"],
			},
		],
	};

	const regioes = {};
	dados.forEach((t) => {
		regioes[t.regiao] = (regioes[t.regiao] || 0) + t.tempo_horas;
	});

	const barData = {
		labels: Object.keys(regioes),
		datasets: [
			{
				label: "Horas por Região",
				data: Object.values(regioes),
				backgroundColor: "#9333ea",
			},
		],
	};

	const optionsDefault = {
		maintainAspectRatio: false,
		plugins: { legend: { position: "top" } },
	};

	return (
		<div style={{ display: "grid", gap: 30, marginBottom: 30 }}>
			<div
				className="card"
				style={{ maxWidth: 500, height: 350, margin: "0 auto" }}
			>
				<h2 style={{ textAlign: "center" }}>
					Água Salgada x Água Doce
				</h2>
				<div style={{ height: 260 }}>
					<Pie data={pieData} options={optionsDefault} />
				</div>
			</div>

			<div
				className="card"
				style={{ maxWidth: 700, height: 400, margin: "0 auto" }}
			>
				<h2 style={{ textAlign: "center" }}>
					Tempo por Região (horas)
				</h2>
				<div style={{ height: 300 }}>
					<Bar data={barData} options={optionsDefault} />
				</div>
			</div>
		</div>
	);
}
