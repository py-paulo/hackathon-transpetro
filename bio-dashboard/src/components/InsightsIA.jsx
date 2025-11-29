export default function InsightsIA({
	naviosResumo,
	intervalosNavio,
	tipos,
	previsao,
}) {
	if (!naviosResumo) return <p>Carregando dados...</p>;

	// Previsão simples: navio com maior intervalo deve inspecionar primeiro
	const naviosOrdenados = [...naviosResumo].sort(
		(a, b) => b.mediana_dias_entre_iws - a.mediana_dias_entre_iws
	);

	const maiorRisco = naviosOrdenados[0];

	const tiposMaisComum = tipos?.embarcacao?.slice(0, 3) || [];

	// escolhe o navio com menor “dias_previstos_ate_proxima_iws”
	const previsoesValidas = previsao.filter(
		(p) =>
			p.dias_previstos_ate_proxima_iws &&
			!isNaN(p.dias_previstos_ate_proxima_iws)
	);

	const proximoEmRisco = previsoesValidas.sort(
		(a, b) =>
			a.dias_previstos_ate_proxima_iws - b.dias_previstos_ate_proxima_iws
	)[0];
	return (
		<div className="card" style={{ padding: 30 }}>
			<h1>Insights de IA para Manutenção</h1>
			<p style={{ color: "#555" }}>
				Recomendações geradas automaticamente a partir do histórico da
				frota.
			</p>

			<hr />
			{proximoEmRisco && (
				<>
					<h2>Próxima janela estimada de IWS (SARIMA)</h2>
					<p>
						Navio <strong>{proximoEmRisco.Embarcação}</strong> deve
						entrar em janela de inspeção por volta de{" "}
						<strong>
							{proximoEmRisco.data_prevista_proxima_iws}
						</strong>{" "}
						(previsão de{" "}
						{proximoEmRisco.dias_previstos_ate_proxima_iws.toFixed(
							0
						)}{" "}
						dias a partir da última IWS).
					</p>
				</>
			)}

			<hr />

			<h2>🚨 Navio com maior risco de incrustação</h2>
			<div className="card" style={{ margin: "14px 0" }}>
				<p>
					<strong>Navio:</strong> {maiorRisco["Nome do navio"]}
				</p>
				<p>
					<strong>Classe:</strong> {maiorRisco.Classe}
				</p>
				<p>
					<strong>Mediana entre IWS:</strong>{" "}
					{maiorRisco.mediana_dias_entre_iws} dias
				</p>
			</div>

			<h2>📌 Tipos mais comuns de incrustação</h2>
			<ul>
				{tiposMaisComum.map((t) => (
					<li key={t.tipo}>
						<strong>{t.tipo}</strong> — {t.quantidade} ocorrências
					</li>
				))}
			</ul>

			<h2>🛠 Sugestões automáticas</h2>
			<ul>
				<li>
					Navios com mediana acima de 400 dias devem ser priorizados
					para inspeção preventiva.
				</li>
				<li>
					Classes com maior média de incrustação devem ser programa‐
					das para limpeza com maior frequência.
				</li>
				<li>
					Tipos mais recorrentes (“craca”, “limo”, “alga”) sugerem
					possível falha de proteção anti-incrustante.
				</li>
			</ul>

			<p style={{ marginTop: 20, fontStyle: "italic", color: "#777" }}>
				Essas recomendações foram geradas com base nos intervalos reais
				e nos tipos observados nos relatórios IWS.
			</p>
		</div>
	);
}
