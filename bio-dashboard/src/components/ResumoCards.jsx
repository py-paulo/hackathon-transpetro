function Card({ titulo, valor, descricao }) {
	return (
		<div
			style={{
				padding: 16,
				borderRadius: 12,
				border: "1px solid #ddd",
				backgroundColor: "#ffffff",
				minWidth: 200,
				boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
			}}
		>
			<h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>{titulo}</h3>
			<div
				style={{
					fontSize: "1.6rem",
					fontWeight: "bold",
					marginBottom: 4,
				}}
			>
				{valor}
			</div>
			{descricao && (
				<p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
					{descricao}
				</p>
			)}
		</div>
	);
}

export default function ResumoCards({ kpis }) {
	const tipoMaisComum = kpis.tipo_incrustacao_mais_comum || "N/A";

	return (
		<div
			style={{
				display: "flex",
				gap: 16,
				flexWrap: "wrap",
			}}
		>
			<Card
				titulo="Navios monitorados"
				valor={kpis.total_navios}
				descricao="Quantidade total de navios na base."
			/>
			<Card
				titulo="Inspeções IWS registradas"
				valor={kpis.total_inspecoes_iws}
				descricao="Total de inspeções e limpezas de casco."
			/>
			<Card
				titulo="Tipo de incrustação mais comum"
				valor={tipoMaisComum}
				descricao="Com base nos relatórios IWS."
			/>
		</div>
	);
}
