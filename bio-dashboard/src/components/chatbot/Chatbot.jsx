import { useState, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import Papa from "papaparse";

// ---------------------------------------------------------
// IMPORTAÇÃO DOS CSVS (Vite ?raw import)
// NOTA: Estes caminhos assumem que a pasta 'code' está no mesmo nível que 'bio-dashboard'
// ---------------------------------------------------------
import resumoRaw from "../../../../code/scripts/results/iws_resumo_por_navio.csv?raw";
import deterioracaoRaw from "../../../../code/scripts/results/iws_deterioracao_cruzado.csv?raw";
import sugestoesRaw from "../../../../code/scripts/results/sugestoes_limpeza.csv?raw";
import consumoRaw from "../../../../code/scripts/results/consumo_mensal_por_navio.csv?raw";
import eficienciaRaw from "../../../../code/scripts/results/eficiencia_por_navio_mensal.csv?raw";
import tiposRaw from "../../../../code/scripts/results/iws_analise_por_tipo.csv?raw";

const ALLOWED_TOPICS = [
	"navio",
	"navios",
	"manutenção",
	"bioincrustação",
	"iws",
	"casco",
	"limpeza",
	"combustível",
	"consumo",
	"eficiência",
	"drag",
	"arrasto",
	"anti-incrustante",
	"pintura",
	"normam",
	"atenção",
	"urgente",
	"crítico",
	"ruim",
	"pior",
	"inspeção",
];

const THEME_COLOR = "bg-[#0F3152]";

// -----------------------------
// UTILITÁRIOS
// -----------------------------
function isAllowed(msg) {
	const t = msg.toLowerCase();
	return ALLOWED_TOPICS.some((k) => t.includes(k));
}

function normalizar(str) {
	if (!str) return "";
	return String(str)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]/g, ""); // Remove tudo que não for letra/número
}

function parseCSV(csvText) {
	return new Promise((resolve) => {
		Papa.parse(csvText, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: true,
			complete: (res) => resolve(res.data),
			error: () => resolve([]),
		});
	});
}

// Ajuda a achar a coluna certa do nome do navio (flexibilidade de CSV)
function getNavioName(row) {
	return (
		row.nome_navio ||
		row.navio ||
		row.NOME ||
		row.Navio ||
		row["Nome do navio"] ||
		""
	);
}

// -----------------------------
// LÓGICA DE BUSCA (CORRIGIDA)
// -----------------------------

function consultarResumo(dados, pergunta) {
	if (!dados || dados.length === 0) return null;

	const perguntaNorm = normalizar(pergunta);

	const navio = dados.find((row) => {
		const nome = getNavioName(row);
		if (!nome) return false;

		const nomeNorm = normalizar(nome);

		// Novo: match parcial (3 letras)
		return (
			nomeNorm.length >= 3 && perguntaNorm.includes(nomeNorm.slice(0, 3))
		);
	});

	if (!navio) return null;

	const nome = getNavioName(navio);

	return `
Resumo Técnico — ${nome}

• Classe: ${navio.classe || navio.Classe || navio["Classe"] || "—"}
• Tipo: ${navio.tipo || navio.Tipo || navio["Tipo"] || "—"}
• Porte (DWT): ${navio.dwt || navio.DWT || navio["Porte"] || "—"}
• Último IWS: ${navio.ultima_iws || navio["Ultimo IWS"] || "—"}
• Intervalo Médio IWS: ${
		navio.mediana_dias_iws || navio["Intervalo"] || "—"
	} dias

Operação:
• Velocidade Média: ${
		navio.velocidade_media ? Number(navio.velocidade_media).toFixed(2) : "—"
	} nós
• Consumo Total: ${navio.consumo_total || "—"} t
• Distância Percorrida: ${navio.distancia_nm || "—"} NM
`.trim();
}

function consultarCriticos(sugestoes) {
	if (!sugestoes || sugestoes.length === 0)
		return "Sem dados de sugestões carregados.";

	const criticos = sugestoes.filter((s) => {
		const rec = normalizar(s.recomendacao || "");
		const prazo = s.prazo_dias || 999;
		return (
			rec.includes("limpeza") || rec.includes("inspecao") || prazo < 60
		);
	});

	if (criticos.length === 0)
		return "Nenhum navio precisa de atenção urgente no momento.";

	criticos.sort((a, b) => (a.prazo_dias || 999) - (b.prazo_dias || 999));

	const lista = criticos
		.slice(0, 5)
		.map(
			(n, i) =>
				`${i + 1}. ${getNavioName(n)} (Prazo: ${n.prazo_dias} dias) - ${
					n.recomendacao
				}`
		)
		.join("\n");

	return `Navios requerendo atenção:\n\n${lista}`;
}

function consultarTiposIncrustacao(dados) {
	if (!dados || dados.length === 0) return null;

	const count = {};
	dados.forEach((row) => {
		// Tenta pegar o tipo em várias colunas possíveis
		const tipo =
			row.tipo_normalizado || row.tipo || row.TIPO || "Indefinido";
		if (tipo !== "Indefinido") {
			count[tipo] = (count[tipo] || 0) + 1;
		}
	});

	const ranking = Object.entries(count)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	if (ranking.length === 0)
		return "Não foram encontrados dados de tipos de incrustação.";

	return (
		"Top Tipos de Bioincrustação:\n\n" +
		ranking
			.map(([k, v], i) => `${i + 1}. ${k} — ${v} ocorrências`)
			.join("\n")
	);
}

function consultarSugestoes(dados, pergunta) {
	if (!dados) return null;
	const perguntaNorm = normalizar(pergunta);

	const row = dados.find((r) => {
		const nome = normalizar(getNavioName(r));
		return nome.length > 2 && perguntaNorm.includes(nome);
	});

	if (!row) return null;
	return `Limpeza — ${getNavioName(row)}\n• Fouling Estimado: ${
		row.fouling_estimado
	}\n• Recomendação: ${row.recomendacao}\n• Prazo Sugerido: ${
		row.prazo_dias
	} dias`;
}

function consultarConsumo(dados, pergunta) {
	if (!dados) return null;
	const perguntaNorm = normalizar(pergunta);

	// Filtra todos os registros do navio
	const rows = dados.filter((r) => {
		const nome = normalizar(getNavioName(r));
		return nome.length > 2 && perguntaNorm.includes(nome);
	});

	if (rows.length === 0) return null;

	// Pega o último registro (mais recente)
	const row = rows[rows.length - 1];
	return `Consumo — ${getNavioName(row)}\n• Mês/Ano: ${
		row.mes_ano || "Recente"
	}\n• Consumo: ${row.consumo_mensal} t\n• Eficiência: ${row.eficiencia}%`;
}

// -----------------------------
// COMPONENTE REACT
// -----------------------------
export default function Chatbot() {
	const [open, setOpen] = useState(false);
	const [msg, setMsg] = useState("");
	const [chat, setChat] = useState([]);
	const [loading, setLoading] = useState(false);

	const [dataStore, setDataStore] = useState({
		resumo: [],
		tipos: [],
		sugestoes: [],
		consumo: [],
		eficiencia: [],
	});

	useEffect(() => {
		async function loadAll() {
			try {
				const resumo = await parseCSV(resumoRaw);
				const tipos = await parseCSV(tiposRaw);
				const sugestoes = await parseCSV(sugestoesRaw);
				const consumo = await parseCSV(consumoRaw);
				const eficiencia = await parseCSV(eficienciaRaw);

				console.log("📊 CSVs Carregados:", {
					resumoExemplo: resumo[0],
					tiposExemplo: tipos[0],
				});

				setDataStore({ resumo, tipos, sugestoes, consumo, eficiencia });
			} catch (error) {
				console.error("Erro fatal ao carregar CSVs:", error);
			}
		}
		loadAll();
	}, []);

	async function enviar() {
		if (!msg.trim()) return;
		const pergunta = msg.trim();

		setChat((c) => [...c, { autor: "user", texto: pergunta }]);
		setMsg("");
		setLoading(true);

		// Delay UX
		await new Promise((r) => setTimeout(r, 600));

		const pNormalizada = normalizar(pergunta);

		// 1. Filtro de Segurança
		if (!isAllowed(pergunta)) {
			setChat((c) => [
				...c,
				{
					autor: "bot",
					texto: "⚠️ Sou um assistente técnico naval. Pergunte sobre navios, consumo ou manutenção.",
				},
			]);
			setLoading(false);
			return;
		}

		let resposta = null;
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer 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`,
						},
						body: JSON.stringify({
							model: "llama-3.3-70b-versatile",
							messages: [
								{
									role: "system",
									content:
										"Você é um assistente naval. Responda de forma curta e técnica. Se a pergunta for sobre um navio específico e você não recebeu dados sobre ele, diga: 'Não encontrei dados sobre este navio na base interna'.",
								},
								{ role: "user", content: pergunta },
							],
							temperature: 0.1,
							max_tokens: 200,
						}),
					}
				);
				const json = await resp.json();
				const iaResponse =
					json.choices?.[0]?.message?.content || "Sem resposta.";
				setChat((c) => [...c, { autor: "bot", texto: iaResponse }]);
			} catch {
				setChat((c) => [
					...c,
					{ autor: "bot", texto: "Erro de conexão com o servidor." },
				]);
			}
		}
		setLoading(false);
	}

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className={`fixed bottom-6 right-6 ${THEME_COLOR} text-white p-4 rounded-full shadow-xl z-50 hover:brightness-110 transition-all`}
			>
				<MessageCircle size={26} />
			</button>

			{open && (
				<div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-300 z-50 flex flex-col font-sans animate-in fade-in slide-in-from-bottom-5">
					<div
						className={`${THEME_COLOR} text-white p-3 rounded-t-xl flex justify-between items-center shadow-md`}
					>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
							<strong>Assistente Naval</strong>
						</div>
						<button
							onClick={() => setOpen(false)}
							className="hover:bg-white/20 p-1 rounded"
						>
							<X size={20} />
						</button>
					</div>

					<div className="p-3 h-80 overflow-y-auto space-y-3 bg-slate-50 scrollbar-thin">
						{chat.map((m, i) => (
							<div
								key={i}
								className={`flex ${
									m.autor === "user"
										? "justify-end"
										: "justify-start"
								}`}
							>
								<div
									className={`max-w-[85%] p-2.5 rounded-2xl text-sm whitespace-pre-line shadow-sm ${
										m.autor === "user"
											? "bg-blue-100 text-blue-900 rounded-tr-none border border-blue-200"
											: "bg-white text-gray-800 rounded-tl-none border border-gray-200"
									}`}
								>
									{m.texto}
								</div>
							</div>
						))}
						{loading && (
							<div className="flex justify-start">
								<div className="bg-white p-2 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm text-xs text-gray-500 italic">
									Consultando base de dados...
								</div>
							</div>
						)}
					</div>

					<div className="p-3 border-t bg-white rounded-b-xl flex gap-2">
						<input
							value={msg}
							onChange={(e) => setMsg(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && enviar()}
							className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
							placeholder="Ex: Resumo do navio..."
						/>
						<button
							onClick={enviar}
							className={`${THEME_COLOR} text-white p-2 rounded-lg hover:brightness-110 transition-all shadow-sm`}
						>
							<Send size={18} />
						</button>
					</div>
				</div>
			)}
		</>
	);
}
