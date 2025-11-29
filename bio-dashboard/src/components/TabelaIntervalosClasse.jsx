export default function TabelaIntervalosClasse({ dados }) {
	if (!dados || dados.length === 0) {
		return <p>Não há dados suficientes para resumo por classe.</p>;
	}

	return (
		<div style={{ overflowX: "auto" }}>
			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
					fontSize: "0.9rem",
					backgroundColor: "#fff",
				}}
			>
				<thead>
					<tr style={{ backgroundColor: "#eee" }}>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Classe
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Navios com histórico
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Média das medianas (dias)
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Menor mediana (dias)
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Maior mediana (dias)
						</th>
					</tr>
				</thead>
				<tbody>
					{dados.map((linha) => (
						<tr key={linha.classe}>
							<td
								style={{ padding: 6, border: "1px solid #eee" }}
							>
								{linha.classe}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.qtd_navios_com_historico}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.media_mediana_dias_entre_iws.toFixed(1)}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.min_mediana_dias_entre_iws}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.max_mediana_dias_entre_iws}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<p style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
				Esses valores retratam somente o histórico desta base por classe
				de navio.
			</p>
		</div>
	);
}
