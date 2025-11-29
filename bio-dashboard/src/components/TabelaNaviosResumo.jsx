import { useMemo, useState } from "react";

export default function TabelaNaviosResumo({ dados }) {
	const [filtroClasse, setFiltroClasse] = useState("todos");

	const classes = useMemo(() => {
		const set = new Set();
		dados.forEach((d) => {
			if (d.Classe) {
				set.add(d.Classe);
			}
		});
		return Array.from(set);
	}, [dados]);

	const filtrados = useMemo(() => {
		if (filtroClasse === "todos") {
			return dados;
		}
		return dados.filter((d) => d.Classe === filtroClasse);
	}, [dados, filtroClasse]);

	if (!dados || dados.length === 0) {
		return <p>Sem dados consolidados de navios.</p>;
	}

	return (
		<div>
			<div style={{ marginBottom: 8 }}>
				<label>
					Filtrar por classe.{" "}
					<select
						value={filtroClasse}
						onChange={(e) => setFiltroClasse(e.target.value)}
					>
						<option value="todos">Todas</option>
						{classes.map((classe) => (
							<option key={classe} value={classe}>
								{classe}
							</option>
						))}
					</select>
				</label>
			</div>

			<div
				style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}
			>
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
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Navio
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Classe
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Tipo
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Porte bruto
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Qtde IWS
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Última IWS
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Mediana entre IWS (dias)
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Trilhas AIS (pontos)
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Velocidade média (kn)
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Distância total (NM)
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Horas totais
							</th>
							<th
								style={{ padding: 8, border: "1px solid #ddd" }}
							>
								Consumo total
							</th>
						</tr>
					</thead>
					<tbody>
						{filtrados.map((navio) => (
							<tr key={navio.NOME_NORMALIZADO}>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
									}}
								>
									{navio["Nome do navio"]}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
									}}
								>
									{navio.Classe}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
									}}
								>
									{navio.Tipo}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio["Porte Bruto"]?.toLocaleString(
										"pt-BR"
									)}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.qtd_iws ?? 0}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
									}}
								>
									{navio.ultima_iws || "-"}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.mediana_dias_entre_iws
										? navio.mediana_dias_entre_iws.toFixed(
												1
										  )
										: "-"}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.pontos_total ?? 0}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.velocidade_media
										? navio.velocidade_media.toFixed(1)
										: "-"}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.distancia_total_nm
										? navio.distancia_total_nm.toFixed(0)
										: "-"}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.duracao_total_h
										? navio.duracao_total_h.toFixed(0)
										: "-"}
								</td>
								<td
									style={{
										padding: 6,
										border: "1px solid #eee",
										textAlign: "right",
									}}
								>
									{navio.combustivel_total
										? navio.combustivel_total.toFixed(1)
										: "-"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
				Observação. Os intervalos de manutenção aqui são calculados
				apenas a partir das datas reais de IWS desta base.
			</p>
		</div>
	);
}
