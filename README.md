# Hackathon Transpetro

---

<p align="center"><a href="https://github.com/py-paulo/hackathon-transpetro" target="_blank" rel="noopener noreferrer">
  <img src="https://i.pinimg.com/736x/6f/37/6a/6f376a2917d9be210a03f660c0b77b93.jpg" alt="NAVIA"></a>
</p>

<p align="center">
    <img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/py-paulo/hackathon-transpetro">
    <img alt="PyPI" src="https://img.shields.io/pypi/v/hackathon-transpetro">
    <img alt="PyPI - Wheel" src="https://img.shields.io/pypi/wheel/hackathon-transpetro">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/py-paulo/hackathon-transpetro">
    <br>
    <img alt="GitHub" src="https://img.shields.io/github/license/py-paulo/hackathon-transpetro">
</p>

<p align="center">
  Uma plataforma que integre os dados disponíveis, utilizando algoritmos de Machine Learning para calcular métricas e previsões numéricas, e uma LLM (via RAG - Retrieval-Augmented Generation) para interpretar esses resultados e responder perguntas dos usuários em linguagem natural, melhorando a eficiência das embarcações através de decisões baseadas em dados.
</p>

---

```
.
├── bio-dashboard           # frontend react
│
├── code
│   ├── api                 # backend em nodejs
│   └── scripts
│       └── results         # resultado do processamento de dados
└── data
    └── Dados_AIS_frota_TP  # Dados disponibilizados da transpetro
```

## Proposta de solução

A ideia central é construir uma plataforma que integre os dados disponíveis de consumo, navegação, registros de inspeções, condições ambientais, características das embarcações, entre outros, para realizar análises sobre os impactos de bioincrustações no desempenho dos navios e com base nessas informações geradas, criar previsões sobre estimativas de custos/gasto de combustível e limpeza de forma a melhorar a eficiência dos navios.

### Pilares da Solução

#### Aprendizado Contínuo do Modelo de ML

O ponto central é como os dados de navegação são coletados frequentemente, alimentando os algoritmos de **Machine Learning** que aprendem continuamente. A cada nova viagem, os dados reais validam as previsões anteriores, permitindo que o modelo refine seus parâmetros automaticamente. Quanto mais a frota navega, mais preciso o algoritmo se torna.

**Como funciona:**
1. **ML calcula** previsões numéricas (taxa de deterioração, consumo futuro)
2. **Navio navega** e gera dados reais
3. **ML compara** previsão vs. realidade e ajusta o modelo
4. **Próxima previsão** é mais precisa

#### Inteligência Híbrida: ML + LLM

Um ponto de destaque da solução é integrar o uso de algoritmos de **ML** (para cálculos precisos) com **LLM** (para interpretação e comunicação):

- **ML (Machine Learning)**: 
  - Calcula métricas numéricas (regressão, séries temporais)
  - Faz previsões de consumo e deterioração
  - Processa dados estruturados
  - Aprende continuamente com novos dados

- **LLM (Large Language Model)**:
  - Interpreta os resultados do ML
  - Cruza informações de múltiplas fontes (IWS, docagens, condições ambientais)
  - Gera insights em linguagem natural
  - Responde perguntas dos usuários via chat
  - Explica a causa raiz dos problemas

```
                    ARQUITETURA HÍBRIDA                         
                                                                 
   DADOS BRUTOS
   (CSV, MongoDB)
       │
       ▼
   ┌─────────────────────────────────────┐
   │      MACHINE LEARNING (ML)          │
   │  • Regressão linear (deterioração)  │
   │  • Séries temporais (previsões)     │
   │  • Agregações e métricas            │
   │                                     │
   │  SAÍDA: Números, métricas, gráficos │
   │  APRENDIZADO: Contínuo (retreino)   │
   └────────┬────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │         API REST (Node.js)          │
   │  Disponibiliza dados processados    │
   └────────┬────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │      LLM (via RAG)                  │
   │  • Recebe dados da API como contexto│
   │  • Interpreta resultados do ML      │
   │  • Cruza informações complexas      │
   │  • Gera insights em linguagem       │
   │    natural                          │
   │                                     │
   │  SAÍDA: Texto explicativo,          │
   │         recomendações, respostas    │
   └────────┬────────────────────────────┘
            │
            ▼
   DECISÕES INTELIGENTES
   (Interface Web + Chat)
```

#### Funcionalidades da Plataforma

- **Insights em linguagem natural**: A LLM explica os dados e a causa raiz dos problemas identificados pelo ML
- **Visualizações interativas**: A aplicação web gera gráficos e dashboards com os dados coletados e previsões
- **Histórico digitalizado**: Todas as inspeções e limpezas são registradas e correlacionadas com os dados de consumo
- **Calculadora de Decisão**: Simulação financeira que compara "Custo da Limpeza" vs. "Prejuízo de Combustível", indicando o ponto ótimo de manutenção
- **Chat inteligente**: Interface conversacional onde usuários fazem perguntas sobre a frota e recebem respostas contextuais baseadas nos dados processados

#### Divisão de Responsabilidades

| Tarefa | Tecnologia | Por quê |
|--------|------------|---------|
| Calcular taxa de deterioração | **ML (Regressão)** | Precisão matemática, aprendizado contínuo |
| Prever consumo futuro | **ML (Séries Temporais)** | Análise numérica de padrões temporais |
| Normalizar scores IWS | **ML/Scripts Python** | Transformação de dados estruturados |
| Explicar resultados em texto | **LLM** | Geração de linguagem natural |
| Responder perguntas do usuário | **LLM (RAG)** | Compreensão de linguagem natural |
| Cruzar dados complexos | **LLM** | Raciocínio sobre múltiplos contextos |

## Proposta de Valor

Transformamos dados brutos em inteligência financeira e ambiental. Nossa plataforma une Machine Learning e IA para monitorar a bioincrustação, prevendo o ponto exato de equilíbrio econômico para manutenção. O resultado é a máxima eficiência de combustível.

Entregamos uma Calculadora de Decisão que elimina o 'achismo', garantindo que cada limpeza seja realizada no momento que maximiza o ROI e assegura a conformidade com as metas de descarbonização da IMO.

**Algoritmo de ML que aprende continuamente:** cada viagem valida e refina as previsões automaticamente. O modelo de regressão é retreinado periodicamente com os novos dados, melhorando sua precisão ao longo do tempo.

### Métricas

#### Taxa de deterioração

Para entender o impacto real da bioincrustação em uma embarcação podemos calcular a perda de eficiência através do consumo entre as docagens, que seria a `distância × consumo`, somente períodos de navegação dos dados que temos e entre as datas de docagem, aplicando uma regressão linear da métrica `consumo_por_milha_náutica (ton/nm)` ao longo do tempo.

<details>
<summary>Conceito de Taxa de Deterioração</summary>

A **taxa de deterioração** é calculada através de **regressão linear** do consumo por milha náutica em função do tempo:

```
consumo_por_milha(t) = β₀ + β₁ × t + ε

onde:
- β₁ = taxa de deterioração (coeficiente angular)
- t = tempo (em dias desde a última docagem)
- β₀ = consumo base (intercepto)
```

**R² (Coeficiente de Determinação)**

Mede quanto da variação do consumo é explicada pelo tempo (bioincrustação).

```
Valor  R²	 Interpretação
0.00 - 0.05  ❌ Muito fraco - o tempo quase não explica a variação
0.05 - 0.15	⚠️ Fraco - outros fatores dominam
0.15 - 0.30	🔶 Moderado - tempo tem influência perceptível
0.30 - 0.50	✅ Bom - deterioração é fator relevante
> 0.50	🎯 Forte - deterioração é fator dominante
```
</details>

#### Impacto da bioincrustação no consumo

Com os dados de texa de deteriorização do consumo podemos relaciona-los com os *relatórios de IWS* e entender a relação entre a bioinscrutação e o impacto no consumo e fazer previsões futuras.

<details>
<summary>fórmulas</summary>

**Normalização do Score de Bioincrustação**

O primeiro passo é transformar os dados qualitativos/heterogêneos do IWS em um score numérico normalizado (0 a 1).

**Dados de entrada (IWS)**

Os relatórios IWS contêm valores de condição em diferentes formatos:
* Valores decimais: 0.1, 0.5, 0.8, 1
* Porcentagens em texto: "70-80%", "50-60%"
* Níveis NORMAM 401: 1, 2, 3 (escala de 0-4)

**Fórmula de normalização**

Para valores decimais (0 ≤ x ≤ 1):
```
score = x
```

**Para porcentagens em texto (ex: "70-80%"):**

```
score = (valor_min + valor_max) / 2 / 100score = (70 + 80) / 2 / 100 = 0.75
```

**Para níveis NORMAM (1-4):**

```
score = valor / 4
```

> Onde nível 4 = 100% incrustado

**O score de bioincrustação é a média das condições disponíveis:**

```
Score_bioincrustação = (cond_geral + cond_fundo + cond_costado + cond_helice) / n_válidos
```

**Diagrama de relações**

```
┌─────────────────┐      tempo       ┌─────────────────┐
│    DOCAGEM      │ ───────────────► │  BIOINCRUSTAÇÃO │
│  (Casco limpo)  │                  │   (IWS Score)   │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              │ correlação
                                              ▼
┌─────────────────┐                  ┌─────────────────┐
│    CONSUMO      │ ◄──────────────  │  DETERIORAÇÃO   │
│  (ton/nm)       │     impacto      │  (ton/nm/mês)   │
└─────────────────┘                  └─────────────────┘
```

</details>

#### Consumo mensal

Relação entre `consumo (ton) / distância (milhas náuticas)`

#### Eficiência da embarcação

**Fórmula:**

```
eficiencia_transporte = distance / consumo_ton
```
> Unidade: milhas náuticas por tonelada de combustível (nm/ton)

**Interpretação:**

* Quantas milhas o navio percorre com 1 tonelada de combustível.
* É o inverso do consumo por milha
* Maior valor = mais eficiente

**Exemplo:**

```
Distância: 282 milhas náuticasConsumo: 47 toneladaseficiencia_transporte = 282 / 47 = 6.0 nm/ton
```
