import { useEffect, useState } from "react";
import "./global.css";

import ResumoCards from "./components/ResumoCards.jsx";
import TabelaIntervalosNavio from "./components/TabelaIntervalosNavio.jsx";
import TabelaIntervalosClasse from "./components/TabelaIntervalosClasse.jsx";
import TabelaTiposIncrustacao from "./components/TabelaTiposIncrustacao.jsx";
import TabelaNaviosResumo from "./components/TabelaNaviosResumo.jsx";
import GraficosDashboard from "./components/GraficosDashboard.jsx";
import MapaAIS from "./components/MapaAIS.jsx";
import InsightsIA from "./components/InsightsIA.jsx";
import GraficosAgua from "./components/GraficosAgua.jsx";
import FiltroNavio from "./components/FiltroNavio.jsx";
import GraficoTimelineNavio from "./components/GraficoTimelineNavio.jsx";

import GraficoDesvioConsumo from "./components/GraficoDesvioConsumo.jsx";
import GraficoConsumoPorClasse from "./components/GraficoConsumoPorClasse.jsx";
import GraficoConsumoPorPorte from "./components/GraficoConsumoPorPorte.jsx";
import GraficoConsumoTimelineNavio from "./components/GraficoConsumoTimelineNavio.jsx";

function App() {
	const [kpis, setKpis] = useState(null);
	const [intervalosNavio, setIntervalosNavio] = useState([]);
	const [intervalosClasse, setIntervalosClasse] = useState([]);
	const [tiposIncrustacao, setTiposIncrustacao] = useState(null);
	const [naviosResumo, setNaviosResumo] = useState([]);
	const [carregando, setCarregando] = useState(true);
	const [erro, setErro] = useState(null);
	const [previsao, setPrevisao] = useState([]);
	const [trilhasAIS, setTrilhasAIS] = useState([]);
	const [tempoRegiao, setTempoRegiao] = useState([]);
	const [serieDiaria, setSerieDiaria] = useState([]);
	const [navioSelecionado, setNavioSelecionado] = useState("");
	const [desvioConsumo, setDesvioConsumo] = useState([]);
	const [rankingIncrustacao, setRankingIncrustacao] = useState([]);

	const [pagina, setPagina] = useState("dashboard");

	useEffect(() => {
		async function carregar() {
			try {
				const [
					kpisRes,
					navioRes,
					classeRes,
					tiposRes,
					naviosResumoRes,
					previsaoRes,
					trilhasRes,
					tempoRegiaoRes,
					serieDiariaRes,
					desvioRes,
					rankingRes,
				] = await Promise.all([
					fetch("/data_dash/kpis.json"),
					fetch("/data_dash/iws_intervalos_navio.json"),
					fetch("/data_dash/iws_intervalos_classe.json"),
					fetch("/data_dash/iws_tipos_incrustacao.json"),
					fetch("/data_dash/navios_resumo.json"),
					fetch("/data_dash/previsao_iws_navio.json"),
					fetch("/data_dash/ais_trilhas.json"),
					fetch("/data_dash/tempo_regiao_agua_navio.json"),
					fetch("/data_dash/serie_tempo_regiao_navio.json"),
					fetch("/data_dash/desvio_consumo_navio.json"),
					fetch("/data_dash/iws_incrustacao_ranking.json"),
				]);

				const [
					kpisJson,
					intervalosNavioJson,
					intervalosClasseJson,
					tiposJson,
					naviosResumoJson,
					previsaoJson,
					trilhasJson,
					tempoRegiaoJson,
					serieDiariaJson,
					desvioJson,
					rankingJson,
				] = await Promise.all([
					kpisRes.json(),
					navioRes.json(),
					classeRes.json(),
					tiposRes.json(),
					naviosResumoRes.json(),
					previsaoRes.json(),
					trilhasRes.json(),
					tempoRegiaoRes.json(),
					serieDiariaRes.json(),
					desvioRes.json(),
					rankingRes.json(),
				]);

				setKpis(kpisJson);
				setIntervalosNavio(intervalosNavioJson);
				setIntervalosClasse(intervalosClasseJson);
				setTiposIncrustacao(tiposJson);
				setNaviosResumo(naviosResumoJson);
				setPrevisao(previsaoJson);
				setTrilhasAIS(trilhasJson);
				setTempoRegiao(tempoRegiaoJson);
				setSerieDiaria(serieDiariaJson);
				setDesvioConsumo(desvioJson);
				setRankingIncrustacao(rankingJson);
			} catch (e) {
				console.error(e);
				setErro("Erro ao carregar dados.");
			} finally {
				setCarregando(false);
			}
		}

		carregar();
	}, []);

	if (carregando) {
		return (
			<div className="card" style={{ margin: 50 }}>
				Carregando dashboard...
			</div>
		);
	}

	if (erro) {
		return <div style={{ padding: 20, color: "red" }}>{erro}</div>;
	}

	const dadosFiltrados = navioSelecionado
		? tempoRegiao.filter((t) => t.navio === navioSelecionado)
		: tempoRegiao;

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			<aside
				style={{
					width: 240,
					background: "#1e293b",
					color: "white",
					padding: 20,
					display: "flex",
					flexDirection: "column",
					gap: 20,
				}}
			>
				<h2 style={{ margin: 0 }}>BioDash TransPetro</h2>
				<button
					onClick={() => setPagina("dashboard")}
					style={botaoSidebar(pagina === "dashboard")}
				>
					Dashboard
				</button>
				<button
					onClick={() => setPagina("graficos")}
					style={botaoSidebar(pagina === "graficos")}
				>
					Gráficos
				</button>
				<button
					onClick={() => setPagina("insights")}
					style={botaoSidebar(pagina === "insights")}
				>
					Insights de IA
				</button>
				<button
					onClick={() => setPagina("consumo")}
					style={botaoSidebar(pagina === "consumo")}
				>
					Consumo & Bioincrustação
				</button>
				<button
					onClick={() => setPagina("mapas")}
					style={botaoSidebar(pagina === "mapas")}
				>
					Mapas AIS
				</button>
				<button
					onClick={() => setPagina("agua")}
					style={botaoSidebar(pagina === "agua")}
				>
					Água & Regiões
				</button>
			</aside>

			<main style={{ flex: 1, padding: 30 }}>
				{pagina === "dashboard" && (
					<>
						<header style={{ marginBottom: 24 }}>
							<h1 style={{ marginBottom: 8 }}>
								Dashboard de Bioincrustação da Frota
							</h1>
							<p style={{ margin: 0, color: "#555" }}>
								Visão integrada da situação do casco, histórico
								de manutenção e operação dos navios.
							</p>
						</header>

						<ResumoCards kpis={kpis} />

						<div
							style={{ display: "grid", gap: 24, marginTop: 24 }}
						>
							<section className="card">
								<h2>Resumo por navio</h2>
								<TabelaNaviosResumo dados={naviosResumo} />
							</section>

							<section className="card">
								<h2>Intervalos entre inspeções por navio</h2>
								<TabelaIntervalosNavio
									dados={intervalosNavio}
								/>
							</section>

							<section className="card">
								<h2>Resumo de intervalos por classe</h2>
								<TabelaIntervalosClasse
									dados={intervalosClasse}
								/>
							</section>

							<section className="card">
								<h2>Tipos de bioincrustação observados</h2>
								<TabelaTiposIncrustacao
									dados={tiposIncrustacao}
								/>
							</section>
						</div>
					</>
				)}

				{pagina === "graficos" && (
					<GraficosDashboard
						intervalosNavio={intervalosNavio}
						intervalosClasse={intervalosClasse}
						tiposIncrustacao={tiposIncrustacao}
					/>
				)}

				{pagina === "insights" && (
					<InsightsIA
						naviosResumo={naviosResumo}
						intervalosNavio={intervalosNavio}
						tipos={tiposIncrustacao}
						previsao={previsao}
						rankingIncrustacao={rankingIncrustacao}
					/>
				)}

				{pagina === "consumo" && (
					<>
						<FiltroNavio
							navios={naviosResumo}
							navioSelecionado={navioSelecionado}
							onChange={setNavioSelecionado}
						/>

						<GraficoDesvioConsumo dados={desvioConsumo} />
						<GraficoConsumoPorClasse desvio={desvioConsumo} />
						<GraficoConsumoPorPorte desvio={desvioConsumo} />
						{/* ainda não temos série temporal de consumo por sessão/navio */}
						<GraficoConsumoTimelineNavio
							eventos={[]}
							navio={navioSelecionado}
						/>
					</>
				)}

				{pagina === "mapas" && (
					<MapaAIS trilhas={trilhasAIS} naviosResumo={naviosResumo} />
				)}

				{pagina === "agua" && (
					<>
						<FiltroNavio
							navios={naviosResumo}
							navioSelecionado={navioSelecionado}
							onChange={setNavioSelecionado}
						/>

						<GraficosAgua tempoRegiao={dadosFiltrados} />

						<GraficoTimelineNavio
							serieDiaria={serieDiaria}
							navioSelecionado={navioSelecionado}
						/>
					</>
				)}
			</main>
		</div>
	);
}

function botaoSidebar(ativo) {
	return {
		background: ativo ? "#3b82f6" : "#334155",
		color: "white",
		padding: "10px 16px",
		borderRadius: 8,
		border: "none",
		textAlign: "left",
		fontSize: 16,
		cursor: "pointer",
		transition: "0.2s",
	};
}

export default App;
