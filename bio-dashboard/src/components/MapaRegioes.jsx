import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapaRegioes({ regioesTempo }) {
	if (!regioesTempo || regioesTempo.length === 0) return null;

	return (
		<div className="card" style={{ maxWidth: 1000, margin: "0 auto" }}>
			<h2 style={{ textAlign: "center" }}>Mapa das Regiões</h2>

			<MapContainer
				center={[-15.8, -47.9]}
				zoom={4}
				style={{ height: "500px", width: "100%" }}
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

				{regioesTempo.map((r, i) => (
					<Polygon
						key={i}
						pathOptions={{
							color: "#9333ea",
							fillColor: "#c084fc",
							fillOpacity: 0.4,
						}}
						positions={r.coordenadas}
					>
						<Tooltip>
							<b>{r.regiao}</b>
							<br />
							{r.tempo_horas.toFixed(2)} horas
						</Tooltip>
					</Polygon>
				))}
			</MapContainer>
		</div>
	);
}
