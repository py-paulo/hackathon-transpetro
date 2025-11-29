export default function TabelaIntervalosNavio({ dados }) {
	if (!dados || dados.length === 0) {
		return (
			<p>
				Não há histórico suficiente de inspeções IWS para calcular
				intervalos.
			</p>
		);
	}

	return (
		<div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
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
							Embarcação
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Classe
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Qtde intervalos
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Média (dias)
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Mediana (dias)
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Mínimo (dias)
						</th>
						<th style={{ padding: 8, border: "1px solid #ddd" }}>
							Máximo (dias)
						</th>
					</tr>
				</thead>
				<tbody>
					{dados.map((linha) => (
						<tr key={linha.Embarcação}>
							<td
								style={{ padding: 6, border: "1px solid #eee" }}
							>
								{linha.Embarcação}
							</td>
							<td
								style={{ padding: 6, border: "1px solid #eee" }}
							>
								{linha.Classe}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.qtd_intervalos}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.media_dias_entre_iws.toFixed(1)}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.mediana_dias_entre_iws.toFixed(1)}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.min_dias_entre_iws}
							</td>
							<td
								style={{
									padding: 6,
									border: "1px solid #eee",
									textAlign: "right",
								}}
							>
								{linha.max_dias_entre_iws}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
