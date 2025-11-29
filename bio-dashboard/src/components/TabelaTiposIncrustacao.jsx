export default function TabelaTiposIncrustacao({ dados }) {
	if (!dados) {
		return <p>Dados de tipos de incrustação não disponíveis.</p>;
	}

	const secoes = [
		{ chave: "embarcacao", titulo: "Incrustação na embarcação" },
		{ chave: "fundo_chato", titulo: "Incrustação no fundo chato" },
		{ chave: "costado", titulo: "Incrustação no costado" },
		{ chave: "helice", titulo: "Incrustação no hélice" },
	];

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{secoes.map((secao) => {
				const lista = dados[secao.chave] || [];
				if (lista.length === 0) {
					return (
						<div key={secao.chave}>
							<h3>{secao.titulo}</h3>
							<p>Sem registros suficientes.</p>
						</div>
					);
				}
				return (
					<div key={secao.chave}>
						<h3>{secao.titulo}</h3>
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
										<th
											style={{
												padding: 8,
												border: "1px solid #ddd",
											}}
										>
											Tipo de incrustação
										</th>
										<th
											style={{
												padding: 8,
												border: "1px solid #ddd",
											}}
										>
											Ocorrências
										</th>
									</tr>
								</thead>
								<tbody>
									{lista.map((item) => (
										<tr key={item.tipo}>
											<td
												style={{
													padding: 6,
													border: "1px solid #eee",
												}}
											>
												{item.tipo}
											</td>
											<td
												style={{
													padding: 6,
													border: "1px solid #eee",
													textAlign: "right",
												}}
											>
												{item.quantidade}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				);
			})}
		</div>
	);
}
