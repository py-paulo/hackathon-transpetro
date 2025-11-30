import { useEffect, useState } from "react";
import "./global.css";

import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/sidebar/sidebar';
import Navbar from './components/navbar/navbar';
import Dashboard from './components/dashboard/dashboard';
import Historico from './components/historicoIWS/historicoIWS';
import MapaAIS from './components/mapaAIS/mapaAIS';
import Planejamento from './components/planejamentoROI/planejamentoROI';
import MonitoramentoFrota from './components/monitoramentoFrota/monitoramentoFrota';
import './App.css';

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

	return (
		<div className="layoutContainer">
			<Sidebar mode="search" />
			<div className="contentWrapper">
				<Navbar />
				<main className="mainContent">
					<Routes>
						<Route 
							path="/" 
							element={
								<Dashboard 
									kpis={kpis} 
									intervalosNavio={intervalosNavio} 
									intervalosClasse={intervalosClasse} 
									tiposIncrustacao={tiposIncrustacao} 
								/>
							} 
						/>
						<Route 
							path="/frota" 
							element={
								<MonitoramentoFrota 
									trilhas={trilhasAIS} 
									naviosResumo={naviosResumo} 
								/>
							}
						/>
						<Route 
							path="/historico" 
							element={
								<Historico 
									kpis={kpis}
									naviosResumo={naviosResumo}
									intervalosNavio={intervalosNavio}
									intervalosClasse={intervalosClasse}
									tiposIncrustacao={tiposIncrustacao}
								/>
							} 
						/>
						<Route 
							path="/mapaais" 
							element={
								<MapaAIS 
									trilhas={trilhasAIS} 
            						naviosResumo={naviosResumo}
								/>
							} 
						/>
						<Route path="/planejamento" element={<Planejamento />} />
					</Routes>
				</main>
			</div>
		</div>
	);
}

export default App;
