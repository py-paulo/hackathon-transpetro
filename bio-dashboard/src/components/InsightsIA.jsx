import React from "react";

function formatarNumero(valor, casas = 0) {
	if (valor === null || valor === undefined || isNaN(valor)) return "-";
	return Number(valor).toFixed(casas).replace(".", ",");
}

export default function InsightsIA({
	naviosResumo,
	intervalosNavio,
	tipos,
	previsao,
	rankingIncrustacao,
}) {
	// proteções básicas
	naviosResumo = Array.isArray(naviosResumo) ? naviosResumo : [];
	intervalosNavio = Array.isArray(intervalosNavio) ? intervalosNavio : [];
	previsao = Array.isArray(previsao) ? previsao : [];
	const tiposEmb = tipos?.embarcacao || [];

	// 1) Ranking global de incrustação (já normalizado no pipeline)
	let rankingGlobal = Array.isArray(rankingIncrustacao)
		? rankingIncrustacao
		: [];

	if (!rankingGlobal.length && tiposEmb.length) {
		// fallback: usa apenas o campo de embarcação
		rankingGlobal = tiposEmb;
	}

	const topIncrustacoes = rankingGlobal.slice(0, 5);

	// 2) Navios com maior recorrência de IWS (mediana de intervalo menor)
	const naviosPorIntervalo = [...intervalosNavio]
		.filter(
			(n) =>
				n.mediana_dias_entre_iws !== null &&
				n.mediana_dias_entre_iws !== undefined
		)
		.sort((a, b) => a.mediana_dias_entre_iws - b.mediana_dias_entre_iws)
		.slice(0, 5);

	// 3) Navios com maior tempo previsto até a próxima IWS
	const naviosPorPrevisao = [...previsao]
		.filter(
			(p) =>
				p.dias_previstos_ate_proxima_iws !== null &&
				p.dias_previstos_ate_proxima_iws !== undefined
		)
		.sort(
			(a, b) =>
				b.dias_previstos_ate_proxima_iws -
				a.dias_previstos_ate_proxima_iws
		)
		.slice(0, 5);

	// 4) Classes mais expostas (mais IWS registradas)
	const contagemPorClasse = {};
	for (const nav of naviosResumo) {
		const classe = nav.classe_iws || nav.Classe;
		if (!classe) continue;
		contagemPorClasse[classe] =
			(contagemPorClasse[classe] || 0) + (nav.qtd_iws || 0);
	}
	const rankingClasse = Object.entries(contagemPorClasse)
		.map(([classe, total]) => ({ classe, total }))
		.sort((a, b) => b.total - a.total)
		.slice(0, 5);

	return (
		<div style={{ display: "grid", gap: 24 }}>
			<section className="card">
				<h2>Panorama Inteligente de Bioincrustação</h2>
				<p style={{ marginTop: 4, color: "#4b5563" }}>
					Estes insights são calculados automaticamente a partir dos
					dados do dashboard, usando agregações simples para destacar
					onde a bioincrustação mais aparece e quais navios e classes
					merecem mais atenção.
				</p>
			</section>

			{/* Ranking global de incrustações */}
			<section className="card">
				<h3>Tipos de bioincrustação mais frequentes</h3>
				{topIncrustacoes.length === 0 ? (
					<p>Nenhum dado de bioincrustação disponível.</p>
				) : (
					<ol style={{ marginLeft: 18 }}>
						{topIncrustacoes.map((t, idx) => (
							<li key={t.tipo ?? idx} style={{ marginBottom: 4 }}>
								<strong>{t.tipo}</strong> —{" "}
								{formatarNumero(t.quantidade, 0)} ocorrência(s)
							</li>
						))}
					</ol>
				)}
				<p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
					Os nomes foram normalizados no pipeline para reduzir
					duplicidades como variações de escrita e troca de ordem das
					palavras.
				</p>
			</section>

			{/* Navios com IWS mais recorrentes */}
			<section className="card">
				<h3>
					Navios com IWS mais recorrentes (intervalo mediano mais
					curto)
				</h3>
				{naviosPorIntervalo.length === 0 ? (
					<p>
						Não há histórico suficiente de inspeções para esta
						análise.
					</p>
				) : (
					<table className="tabela-basica">
						<thead>
							<tr>
								<th>Embarcação</th>
								<th>Classe</th>
								<th>Mediana entre IWS (dias)</th>
								<th>Qtd. intervalos</th>
							</tr>
						</thead>
						<tbody>
							{naviosPorIntervalo.map((n) => (
								<tr key={n.NOME_NORMALIZADO}>
									<td>{n.Embarcação}</td>
									<td>{n.Classe}</td>
									<td>
										{formatarNumero(
											n.mediana_dias_entre_iws,
											1
										)}
									</td>
									<td>{n.qtd_intervalos}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				<p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
					Intervalos medianos muito curtos podem indicar embarcações
					operando em ambientes mais agressivos ou com maior propensão
					à bioincrustação.
				</p>
			</section>

			{/* Previsão de próximas IWS */}
			<section className="card">
				<h3>Navios com maior tempo previsto até a próxima IWS</h3>
				{naviosPorPrevisao.length === 0 ? (
					<p>Nenhuma previsão de próxima inspeção disponível.</p>
				) : (
					<table className="tabela-basica">
						<thead>
							<tr>
								<th>Embarcação</th>
								<th>Dias até a próxima IWS (previsto)</th>
								<th>Data prevista</th>
								<th>Última IWS</th>
							</tr>
						</thead>
						<tbody>
							{naviosPorPrevisao.map((p, idx) => (
								<tr key={p.Embarcação ?? idx}>
									<td>{p.Embarcação}</td>
									<td>
										{formatarNumero(
											p.dias_previstos_ate_proxima_iws,
											1
										)}
									</td>
									<td>{p.data_prevista_proxima_iws}</td>
									<td>{p.ultima_iws}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				<p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
					Combinar o tempo previsto até a próxima IWS com os tipos de
					bioincrustação dominantes ajuda a priorizar inspeções e
					limpezas de casco.
				</p>
			</section>

			{/* Classes mais expostas */}
			<section className="card">
				<h3>
					Classes com maior exposição à bioincrustação (mais IWS
					registradas)
				</h3>
				{rankingClasse.length === 0 ? (
					<p>Não há dados suficientes por classe.</p>
				) : (
					<ul style={{ marginLeft: 18 }}>
						{rankingClasse.map((c) => (
							<li key={c.classe} style={{ marginBottom: 4 }}>
								<strong>{c.classe}</strong> —{" "}
								{formatarNumero(c.total, 0)} inspeção(ões)
								registradas
							</li>
						))}
					</ul>
				)}
				<p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
					Essas classes tendem a exigir mais atenção em pintura,
					planejamento de docagem e estratégias de mitigação de
					bioincrustação.
				</p>
			</section>
		</div>
	);
}
