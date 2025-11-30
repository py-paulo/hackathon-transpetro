# Hackathon Transpetro

## Desafio

> Como usar tecnologias inovadoras para monitorar e prever a bioincrustação, aumentando a eficiência operacional, reduzindo consumo de combustível e apoiando a descarbonização da frota da Transpetro.

A bioincrustação — acúmulo de organismos marinhos como cracas e algas no casco das embarcações — é um dos principais desafios da indústria naval. Esse fenômeno aumenta a resistência hidrodinâmica, eleva o consumo de combustível e intensifica as emissões de gases de efeito estufa. Além disso, a NORMAM 401 estabelece limites regulatórios para o nível de bioincrustação permitido, o que torna o monitoramento contínuo uma necessidade operacional e ambiental.

Além dos impactos operacionais, existe a exigência regulatória de manter o casco dentro de padrões específicos de bioincrustação, conforme estabelecido pela NORMAM 401. O consumo de combustível é influenciado por múltiplos fatores, incluindo condições ambientais, estado de carregamento da embarcação e carga do motor, o que dificulta a identificação precisa do consumo adicional atribuível exclusivamente à bioincrustação.

Atualmente, a avaliação do nível de bioincrustação depende de inspeções visuais e análises esporádicas de eficiência energética, processos que são custosos, pouco frequentes e muitas vezes tardios. O desafio é criar soluções que utilizem dados e tecnologia para antecipar esse problema, apoiando decisões de manutenção e contribuindo para a descarbonização da frota da Transpetro.

### 🧠 O que buscamos

* Monitorar e prever o nível de bioincrustação nos cascos das embarcações;
* Estimar o impacto energético e econômico causado pela incrustação;
* Sugerir o momento ideal para limpeza ou manutenção, com base em dados e cenários operacionais;
* Apoiar a gestão da eficiência operacional e a redução de emissões de gases de efeito estufa.

### 📊 Dados disponíveis

Os participantes terão acesso a uma base de dados fornecida pela Transpetro, que inclui:

* Dados de automação e navegação (velocidade, GPS, consumo, perfil operacional);
* Condições ambientais e meteorológicas (vento, ondas, correntes);
* Registros de inspeções e limpezas do casco;
* Características técnicas das embarcações (classe, tinta, curvas de potência, deslocamento etc.).

A Transpetro é a maior companhia de logística multimodal de petróleo, derivados e biocombustíveis da América Latina, criada em 1998 como subsidiária integral da Petrobras. A empresa atua de forma integrada, operando terminais, oleodutos, gasodutos e realizando transporte marítimo e terrestre em todo o Brasil. Possui 48 terminais, cerca de 8,5 mil quilômetros de dutos e uma frota de 33 navios, atendendo mais de 160 clientes, incluindo distribuidoras e indústrias petroquímicas.


## Proposta de solução

A ideia central é construir uma plataforma que integre os dados disponíveis de consumo, navegação, registros de inspeções, condições ambientais, caraceterísticas das embarcações, entre outros, para realizar análises sobre os impactos de bioincrustações no desempenho dos navios e com base nessas informações geradas, criar previsões sobre estimativas de custos/gasto de combustível e limpeza de forma a melhorar a eficiência dos navios. Aplicando algoritmos de Machine Learning para processamento dos dados brutos e I.A para análises e cruzamento de dados mais complexos.

> Resumo: Uma plataforma que integre os dados disponíveis das embarcações, para realizar análises sobre os impactos de bioincrustações no desempenho dos navios e com base nessas informações geradas, criar previsões sobre estimativas de combustível e limpeza de forma a melhorar a eficiência dos navios. Aplicando algoritmos de Machine Learning para processamento dos dados brutos e I.A para análises e cruzamento de dados mais complexos.

### Pilares da Solução

O ponto central é como os dados de navegação são coletados frequentemente, as previsões da IA podem ser refinadas com base nas interações, ou seja, sua previsão vai está sempre sendo testada e recebendo dados reais referente a elas, tornando-se um algoritmo cada vez mais robusto de acertivo.

A aplicação web é responsável por gerar gráficos e previsões em relação aos dados coletados e previsões.

Um ponto de destaque da solução é integrar o uso de algoritmos de ML com a análise e interpretação mais robusta da I.A usando para cruzar informações não tão estruturadas com resultados de análises de ML, podendo assim trazer insights inteligentes para os dados brutos e processados.

Histórico digitalizado de todas as inspeções e limpezas.

Insights em linguagem natural explicando a causa raiz dos problemas.

Calculadora de Decisão: Simulação financeira que compara "Custo da Limpeza" vs. "Prejuízo de Combustível", indicando o ponto ótimo de manutenção.

### Impacto Esperado (ROI & ESG)

Econômico: Redução do consumo de combustível (bunker) através da manutenção no tempo ótimo (evitando navegar com casco sujo e evitando limpezas desnecessárias).

Ambiental: Redução direta das emissões de CO2, alinhando a Transpetro às metas de descarbonização da IMO (Organização Marítima Internacional).

> Cruzar informações de custo de combustível com dados em tempo real do preço do combustível

## Proposta de Valor

Transformamos dados brutos em inteligência financeira e ambiental. Nossa plataforma une Machine Learning e IA para monitorar a bioincrustação, prevendo o ponto exato de equilíbrio econômico para manutenção. O resultado é a máxima eficiência de combustível.

Entregamos uma Calculadora de Decisão que elimina o 'achismo', garantindo que cada limpeza seja realizada no momento que maximiza o ROI e assegura a conformidade com as metas de descarbonização da IMO.

Algoritmo que aprende continuamente: cada viagem valida e refina as previsões automaticamente.

### Métricas

#### Taxa de deteriorização do consumo / Taxa de deteriorização do casco

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

## Brainstorm

### Interface web

* Resumo dos dados
    * Linha temporal de consumo de combustível.
        * navio
        * classe
        * porte
    