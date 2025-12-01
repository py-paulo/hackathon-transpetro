import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageCircle, Send, X } from "lucide-react";

// ------------ TEMAS PERMITIDOS ------------
const ALLOWED_TOPICS = [
	"manutenção de navios",
	"navio",
	"manutenção naval",
	"bioincrustação",
	"incrustação",
	"fouling",
	"iws",
	"in-water survey",
	"consumo de combustível",
	"drag",
	"arrasto",
	"eficiência hidrodinâmica",
	"casco",
	"limpeza de casco",
	"cronograma de manutenção",
	"normam 401",
	"coating",
	"anti-incrustante",
	"pintura do casco",
	"rebocagem",
];

function isAllowed(message) {
	const low = message.toLowerCase();
	return ALLOWED_TOPICS.some((t) => low.includes(t));
}

// ------------ COMPONENTE ------------
export default function Chatbot() {
	const [open, setOpen] = useState(false);
	const [mensagem, setMensagem] = useState("");
	const [chat, setChat] = useState([]);
	const [loading, setLoading] = useState(false);

	async function enviarMensagem() {
		if (!mensagem.trim()) return;

		const userMsg = mensagem.trim();
		setChat((c) => [...c, { autor: "user", texto: userMsg }]);
		setMensagem("");

		// Fallback naval
		if (!isAllowed(userMsg)) {
			setChat((c) => [
				...c,
				{
					autor: "bot",
					texto: "⚠️ Só posso responder sobre: manutenção naval, bioincrustação, limpeza de casco, eficiência hidrodinâmica e consumo de combustível. Pergunta fora do escopo.",
				},
			]);
			return;
		}

		setLoading(true);

		try {
			// GEMINI SDK NOVO
			const genAI = new GoogleGenerativeAI(
				"AIzaSyBWe0jm4Gu7iCNTK_jwHJxuP05iQmxcOUM"
			);

			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-flash",
				systemInstruction:
					"Você é um assistente naval técnico. Responda apenas sobre manutenção naval, bioincrustação, IWS, eficiência hidrodinâmica e consumo de combustível. Nunca invente dados ou procedimentos.",
			});

			// Construindo histórico com sessions
			const history = chat.map((m) => ({
				role: m.autor === "user" ? "user" : "model",
				parts: [{ text: m.texto }],
			}));

			const session = model.startChat({ history });

			// Envia
			const result = await session.sendMessage(userMsg);

			const resposta = result.response.text();

			setChat((c) => [...c, { autor: "bot", texto: resposta }]);
		} catch (err) {
			console.error(err);
			setChat((c) => [
				...c,
				{ autor: "bot", texto: "Erro ao conectar com o Gemini." },
			]);
		}

		setLoading(false);
	}

	return (
		<>
			{/* BOTÃO */}
			<button
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-xl z-50"
			>
				<MessageCircle size={26} />
			</button>

			{/* CAIXA DO CHAT */}
			{open && (
				<div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col">
					{/* HEADER */}
					<div className="bg-green-600 text-white p-3 rounded-t-xl flex justify-between items-center">
						<span className="font-semibold">Assistente Naval</span>
						<button onClick={() => setOpen(false)}>
							<X size={20} />
						</button>
					</div>

					{/* MENSAGENS */}
					<div className="p-3 h-80 overflow-y-auto space-y-3">
						{chat.map((msg, i) => (
							<div
								key={i}
								className={`p-2 rounded-lg text-sm ${
									msg.autor === "user"
										? "bg-green-100 text-green-900 self-end"
										: "bg-gray-100 text-gray-800"
								}`}
							>
								{msg.texto}
							</div>
						))}

						{loading && (
							<div className="text-gray-400 text-sm animate-pulse">
								Processando resposta…
							</div>
						)}
					</div>

					{/* INPUT */}
					<div className="p-3 border-t flex gap-2">
						<input
							value={mensagem}
							onChange={(e) => setMensagem(e.target.value)}
							placeholder="Pergunte algo..."
							className="flex-1 border rounded-lg px-2 py-1 text-sm"
						/>
						<button
							onClick={enviarMensagem}
							className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
						>
							<Send size={16} />
						</button>
					</div>
				</div>
			)}
		</>
	);
}
