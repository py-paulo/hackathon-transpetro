import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

// Mensagens simuladas da conversa
const mensagensIniciais = [
  {
    id: 1,
    role: 'user',
    content: 'Olá! Você pode me ajudar a entender a situação da nossa frota?'
  },
  {
    id: 2,
    role: 'assistant',
    content: 'Olá! Claro, estou aqui para ajudar. Sou um assistente especializado em análise de bioincrustação e eficiência da frota Transpetro. Posso fornecer insights sobre:\n\n• Status da deterioração dos cascos\n• Impacto financeiro da bioincrustação\n• Sugestões de limpeza e manutenção\n• Análise de eficiência energética\n• Alertas críticos\n\nO que você gostaria de saber?'
  },
  {
    id: 3,
    role: 'user',
    content: 'Quais navios precisam de atenção urgente?'
  },
  {
    id: 4,
    role: 'assistant',
    content: 'Com base na análise dos dados, identifiquei **2 navios com urgência CRÍTICA**:\n\n**1. BRUNO LIMA (Gaseiro 7k)**\n• Última docagem: há 4.2 anos\n• Taxa de deterioração: 0.000928 ton/nm/mês\n• Aumento de consumo: +127.8%\n• Score de bioincrustação: 60%\n• **ROI estimado: 902.2%**\n• **Prazo sugerido: 15 dias**\n\n**2. PAULO MOURA (Suezmax)**\n• Taxa de deterioração: 0.001596 ton/nm/mês\n• Aumento de consumo: +75.2%\n• Score de bioincrustação: 40%\n• **ROI estimado: 589.5%**\n• **Prazo sugerido: 15 dias**\n\nEstes navios apresentam sinais críticos de deterioração e recomendo agendar limpeza imediata.'
  },
  {
    id: 5,
    role: 'user',
    content: 'Qual o impacto financeiro da bioincrustação na nossa frota?'
  },
  {
    id: 6,
    role: 'assistant',
    content: 'O impacto financeiro é significativo. Com base nos dados atuais:\n\n**Gasto Extra Mensal Estimado:**\n• Aproximadamente R$ 167k - R$ 287k por navio crítico\n• Total da frota: varia conforme o período analisado\n\n**Principais Custos:**\n• Consumo extra de combustível devido ao aumento de arrasto\n• Redução de eficiência energética\n• Potencial aumento de emissões de CO2\n\n**Economia Potencial com Limpeza:**\n• BRUNO LIMA: R$ 2.0M/ano\n• PAULO MOURA: R$ 3.4M/ano\n• DANIEL PEREIRA: R$ 3.4M/ano\n\nO **payback** médio é de 1.2 a 1.9 meses, tornando a limpeza uma ação altamente rentável.'
  },
  {
    id: 7,
    role: 'user',
    content: 'Como a bioincrustação afeta a eficiência energética?'
  },
  {
    id: 8,
    role: 'assistant',
    content: 'A bioincrustação tem um impacto direto e mensurável na eficiência energética:\n\n**Mecanismos de Impacto:**\n1. **Aumento do arrasto hidrodinâmico** - Organismos aderidos ao casco criam rugosidade\n2. **Redução da eficiência da hélice** - Bioincrustação nas pás reduz a propulsão\n3. **Aumento do consumo de combustível** - Mais energia necessária para manter velocidade\n\n**Dados Observados:**\n• Navios com score de bioincrustação > 60% mostram aumento de consumo de 20-130%\n• A taxa de deterioração média é de 0.0006-0.0016 ton/nm/mês\n• A eficiência de transporte pode cair significativamente\n\n**Recomendação:** Monitoramento contínuo e limpeza preventiva são essenciais para manter a eficiência da frota.'
  },
  {
    id: 9,
    role: 'user',
    content: 'Quais são os principais fatores que determinam a urgência de limpeza?'
  },
  {
    id: 10,
    role: 'assistant',
    content: 'A urgência de limpeza é determinada por múltiplos fatores combinados:\n\n**Fatores Críticos:**\n1. **Taxa de deterioração** - Velocidade de aumento do consumo\n2. **Score de bioincrustação** - Condição atual do casco (0-100%)\n3. **Tempo sem docagem** - Período desde a última limpeza\n4. **Aumento percentual de consumo** - Impacto financeiro imediato\n5. **ROI estimado** - Retorno sobre investimento da limpeza\n\n**Classificação de Urgência:**\n• **CRÍTICA**: Score > 6, aumento > 50%, ROI > 500%\n• **ALTA**: Score 4-6, aumento 20-50%\n• **MODERADA**: Score 2.5-4, aumento 10-30%\n• **BAIXA**: Score < 2, aumento < 10%\n\n**Exemplo Prático:**\nO BRUNO LIMA tem urgência crítica porque combina:\n- 4.2 anos sem docagem\n- Taxa de deterioração alta\n- Aumento de 127.8% no consumo\n- ROI de 902%'
  },
  {
    id: 11,
    role: 'user',
    content: 'Obrigado pelas informações!'
  },
  {
    id: 12,
    role: 'assistant',
    content: 'De nada! Estou sempre disponível para ajudar com análises da frota. Se precisar de mais informações sobre:\n\n• Dados específicos de um navio\n• Análises de tendências\n• Comparações entre classes\n• Projeções futuras\n\nÉ só perguntar! Boa gestão da frota! 🚢'
  }
];

export default function Chat() {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [mostrandoMensagens, setMostrandoMensagens] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [digitando, setDigitando] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Simula o carregamento progressivo das mensagens
  useEffect(() => {
    if (indiceAtual < mensagens.length) {
      const timer = setTimeout(() => {
        if (indiceAtual % 2 === 0) {
          // Mensagem do usuário aparece imediatamente
          setMostrandoMensagens(prev => [...prev, mensagens[indiceAtual]]);
          setIndiceAtual(prev => prev + 1);
        } else {
          // Mensagem do assistente aparece com delay e efeito de digitação
          setDigitando(true);
          setTimeout(() => {
            setMostrandoMensagens(prev => [...prev, mensagens[indiceAtual]]);
            setDigitando(false);
            setIndiceAtual(prev => prev + 1);
          }, 1000);
        }
      }, indiceAtual === 0 ? 500 : 2000);

      return () => clearTimeout(timer);
    }
  }, [indiceAtual, mensagens]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mostrandoMensagens, digitando]);

  const formatarMensagem = (texto) => {
    // Formata markdown básico
    return texto
      .split('\n')
      .map((linha, idx) => {
        // Negrito
        linha = linha.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Lista
        if (linha.trim().startsWith('•')) {
          return `<div style="margin-left: 1rem; margin-top: 0.25rem;">${linha}</div>`;
        }
        return linha ? `<div style="margin-top: ${idx > 0 ? '0.5rem' : '0'}">${linha}</div>` : '<br/>';
      })
      .join('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Assistente de Frota</h1>
            <p className="text-sm text-slate-500">Análise de bioincrustação e eficiência</p>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
        style={{ 
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
          minHeight: 0
        }}
      >
        {mostrandoMensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-3xl rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatarMensagem(msg.content) }}
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="h-5 w-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {/* Indicador de digitação */}
        {digitando && (
          <div className="flex gap-4 justify-start">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area (desabilitado - apenas visual) */}
      <div className="bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
            <MessageCircle className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              disabled
              className="flex-1 bg-transparent border-none outline-none text-slate-600 placeholder:text-slate-400"
            />
            <button
              disabled
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Chat demonstrativo - As mensagens são exibidas automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}

