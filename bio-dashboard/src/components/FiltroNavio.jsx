export default function FiltroNavio({ navios, navioSelecionado, onChange }) {
	const nomes = Array.from(
		new Set(navios.map((n) => n.NOME_NORMALIZADO))
	).filter(Boolean);

	return (
		<div className="card" style={{ marginBottom: 20 }}>
			<label>
				Navio:
				<select
					value={navioSelecionado}
					onChange={(e) => onChange(e.target.value)}
					style={{ marginLeft: 10 }}
				>
					<option value="">Todos</option>
					{nomes.map((nome) => (
						<option key={nome} value={nome}>
							{nome}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}
