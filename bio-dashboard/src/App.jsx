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

	// Novo estado para alternar páginas (Dashboard / Insights)
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
				] = await Promise.all([
					fetch("/data_dash/kpis.json"),
					fetch("/data_dash/iws_intervalos_navio.json"),
					fetch("/data_dash/iws_intervalos_classe.json"),
					fetch("/data_dash/iws_tipos_incrustacao.json"),
					fetch("/data_dash/navios_resumo.json"),
					fetch("/data_dash/previsao_iws_navio.json"),
					fetch("/data_dash/ais_trilhas.json"),
				]);

				const [
					kpisJson,
					intervalosNavioJson,
					intervalosClasseJson,
					tiposJson,
					naviosResumoJson,
					previsaoJson,
					trilhasJson,
				] = await Promise.all([
					kpisRes.json(),
					navioRes.json(),
					classeRes.json(),
					tiposRes.json(),
					naviosResumoRes.json(),
					previsaoRes.json(),
					trilhasRes.json(),
				]);

				setKpis(kpisJson);
				setIntervalosNavio(intervalosNavioJson);
				setIntervalosClasse(intervalosClasseJson);
				setTiposIncrustacao(tiposJson);
				setNaviosResumo(naviosResumoJson);
				setPrevisao(previsaoJson); // novo estado
				setTrilhasAIS(trilhasJson); // novo estado
			} catch (e) {
				console.error(e);
				setErro("Erro ao carregar dados do dashboard.");
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

	// --------------------------
	// UI BONITA + MENU PREMIUM
	// --------------------------

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			{/* SIDEBAR */}
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
					Gráficos
				</button>

				<button
					onClick={() => setPagina("insights")}
					style={botaoSidebar(pagina === "insights")}
				>
					Insights de IA
				</button>
				<button
					onClick={() => setPagina("mapas")}
					style={botaoSidebar(pagina === "mapas")}
				>
					Mapas AIS
				</button>
			</aside>

			{/* CONTEÚDO PRINCIPAL */}
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
					/>
				)}

				{pagina === "mapas" && (
					<MapaAIS trilhas={trilhasAIS} naviosResumo={naviosResumo} />
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
