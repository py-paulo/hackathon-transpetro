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

A ideia central é construir uma plataforma com interface web que faça a integração dos dados disponíveis dos navios (os mesmo citados acima) com dados históricos de bioincrustação em navios, para que uma IA faça previsões de quando deve ser feitas as limpezas e previsões de e economia / gasto.

O ponto central é como os dados de navegação são coletados frequentemente, as previsões da IA podem ser refinadas com base nas interações, ou seja, sua previsão vai está sempre sendo testada e recebendo dados reais referente a elas, tornando-se um algoritmo cada vez mais robusto de acertivo.

A aplicação web é responsável por gerar gráficos e previsões em relação aos dados coletados e previsões.
