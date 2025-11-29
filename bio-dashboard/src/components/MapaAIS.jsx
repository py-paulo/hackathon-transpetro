import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";

export default function MapaAIS({ trilhas, naviosResumo }) {
	const [classeFiltro, setClasseFiltro] = useState("todas");
	const [navioFiltro, setNavioFiltro] = useState("todos");
	const [dataInicio, setDataInicio] = useState("");
	const [dataFim, setDataFim] = useState("");

	const classes = useMemo(() => {
		const set = new Set();
		naviosResumo.forEach((n) => n.Classe && set.add(n.Classe));
		return Array.from(set);
	}, [naviosResumo]);

	const naviosDaClasse = useMemo(() => {
		const filtro =
			classeFiltro === "todas"
				? naviosResumo
				: naviosResumo.filter((n) => n.Classe === classeFiltro);
		return filtro.map((n) => n["Nome do navio"]);
	}, [classeFiltro, naviosResumo]);

	const trilhasFiltradas = useMemo(() => {
		let dados = trilhas;

		if (classeFiltro !== "todas") {
			dados = dados.filter((p) => p.classe === classeFiltro);
		}

		if (navioFiltro !== "todos") {
			dados = dados.filter((p) => p.nome_navio === navioFiltro);
		}

		if (dataInicio) {
			dados = dados.filter((p) => p.datahora >= dataInicio);
		}
		if (dataFim) {
			dados = dados.filter((p) => p.datahora <= `${dataFim} 23:59:59`);
		}

		// agrupa por navio para desenhar trilhas separadas
		const grupos = {};
		dados.forEach((p) => {
			if (!grupos[p.nome_navio]) grupos[p.nome_navio] = [];
			grupos[p.nome_navio].push(p);
		});

		// ordena trilha por data
		Object.values(grupos).forEach((lista) =>
			lista.sort((a, b) => (a.datahora > b.datahora ? 1 : -1))
		);

		return grupos;
	}, [trilhas, classeFiltro, navioFiltro, dataInicio, dataFim]);

	// centro aproximado Brasil
	const center = [-20, -40];

	return (
		<div className="card" style={{ display: "grid", gap: 16 }}>
			<h1>Mapas AIS da Frota</h1>
			<p style={{ color: "#555" }}>
				Visualização das trilhas AIS com filtros por classe, navio e
				período.
			</p>

			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 12,
					alignItems: "center",
					fontSize: "0.9rem",
				}}
			>
				<label>
					Classe.{" "}
					<select
						value={classeFiltro}
						onChange={(e) => {
							setClasseFiltro(e.target.value);
							setNavioFiltro("todos");
						}}
					>
						<option value="todas">Todas</option>
						{classes.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</label>

				<label>
					Navio.{" "}
					<select
						value={navioFiltro}
						onChange={(e) => setNavioFiltro(e.target.value)}
					>
						<option value="todos">Todos</option>
						{naviosDaClasse.map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</label>

				<label>
					Data inicial.{" "}
					<input
						type="date"
						value={dataInicio}
						onChange={(e) => setDataInicio(e.target.value)}
					/>
				</label>

				<label>
					Data final.{" "}
					<input
						type="date"
						value={dataFim}
						onChange={(e) => setDataFim(e.target.value)}
					/>
				</label>
			</div>

			<div style={{ height: 500, width: "100%" }}>
				<MapContainer
					center={center}
					zoom={4}
					style={{ height: "100%", width: "100%" }}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					{Object.entries(trilhasFiltradas).map(
						([nome, pontos], idx) => {
							const path = pontos.map((p) => [p.lat, p.lng]);
							const color = [
								"#2563eb",
								"#10b981",
								"#f97316",
								"#ef4444",
								"#8b5cf6",
							][idx % 5];

							return (
								<Polyline
									key={nome}
									positions={path}
									pathOptions={{ color }}
								>
									<Tooltip sticky>
										<div>
											<strong>{nome}</strong>
											<br />
											Pontos. {pontos.length}
										</div>
									</Tooltip>
								</Polyline>
							);
						}
					)}
				</MapContainer>
			</div>
		</div>
	);
}
