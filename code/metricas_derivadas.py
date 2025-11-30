#!/usr/bin/env python3

from loguru import logger
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Caminhos
DATA_DIR = Path(__file__).parent.joinpath('..', 'data')
OUTPUT_DIR = DATA_DIR / ".." / "code" / "results"
OUTPUT_DIR.mkdir(exist_ok=True)

# ===============================================
# CONSTANTES E FATORES DE CONVERSÃO
# ===============================================

# Fatores de emissão (kg por tonelada de combustível)
# Fonte: IMO GHG Study 2020
EMISSAO_CO2_POR_TON = 3.114   # kg CO2 / kg combustível (HFO/LSHFO)
EMISSAO_SOX_POR_TON = 0.02   # kg SOx / kg combustível (com LSHFO 0.5%)
EMISSAO_NOX_POR_TON = 0.087  # kg NOx / kg combustível

# Preço médio do combustível (USD por tonelada)
# Fonte: Ship & Bunker - preços médios 2024
PRECO_LSHFO = 550  # USD/ton (Low Sulfur Heavy Fuel Oil)
PRECO_MGO = 750    # USD/ton (Marine Gas Oil)

# Taxa de câmbio aproximada
USD_TO_BRL = 5.0


def carregar_dados():
    """Carrega todos os dados necessários"""
    logger.info("📂 Carregando dados...")
    
    # Eventos de navegação
    eventos = pd.read_csv(DATA_DIR / "ResultadoQueryEventos.csv")
    eventos['startGMTDate'] = pd.to_datetime(eventos['startGMTDate'])
    
    # Consumo
    consumo = pd.read_csv(DATA_DIR / "ResultadoQueryConsumo.csv")
    
    # Navios
    navios = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Dados navios.csv")
    
    # Docagens
    docagens = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Lista de docagens.csv")
    docagens['Docagem'] = pd.to_datetime(docagens['Docagem'])
    
    # Revestimentos
    revestimentos = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Especificacao revestimento.csv")
    
    logger.debug(f"✅ Eventos: {len(eventos):,}")
    logger.debug(f"✅ Consumo: {len(consumo):,}")
    logger.debug(f"✅ Navios: {len(navios)}")
    
    return eventos, consumo, navios, docagens, revestimentos


def preparar_dataset_base(eventos, consumo, navios, docagens):
    """Prepara dataset base com merge de todas as fontes"""
    logger.info("🔗 Preparando dataset base...")
    
    # Agrupa consumo por sessão
    consumo_total = consumo.groupby('SESSION_ID')['CONSUMED_QUANTITY'].sum().reset_index()
    consumo_total.columns = ['sessionId', 'consumo_ton']
    consumo_total = consumo_total[consumo_total['consumo_ton'] > 0]
    
    # Filtra eventos de navegação
    df = eventos[eventos['eventName'] == 'NAVEGACAO'].copy()
    
    # Merge com consumo
    df = df.merge(consumo_total, on='sessionId', how='inner')
    
    # Merge com navios
    navios['Nome_upper'] = navios['Nome do navio'].str.upper().str.strip()
    df['shipName_upper'] = df['shipName'].str.upper().str.strip()
    df = df.merge(navios, left_on='shipName_upper', right_on='Nome_upper', how='left')
    
    # Calcula dias desde última docagem
    docagens['Navio'] = docagens['Navio'].str.upper().str.strip()
    
    def dias_desde_docagem(row):
        ship_docagens = docagens[docagens['Navio'] == row['shipName_upper']]
        if len(ship_docagens) == 0:
            return np.nan
        anteriores = ship_docagens[ship_docagens['Docagem'] < row['startGMTDate']]
        if len(anteriores) == 0:
            return np.nan
        return (row['startGMTDate'] - anteriores['Docagem'].max()).days
    
    logger.info("Calculando dias desde docagem...")
    df['dias_desde_docagem'] = df.apply(dias_desde_docagem, axis=1)
    
    # Extrai período
    df['ano'] = df['startGMTDate'].dt.year
    df['mes'] = df['startGMTDate'].dt.month
    df['trimestre'] = df['startGMTDate'].dt.quarter
    
    logger.debug(f"✅ Dataset final: {len(df):,} registros")
    
    return df


def calcular_metricas_eficiencia(df):
    logger.info("📊 EFICIÊNCIA ENERGÉTICA")
    
    df = df.copy()
    
    # Consumo por milha navegada (ton/nm)
    df['consumo_por_milha'] = df['consumo_ton'] / df['distance'].replace(0, np.nan)
    
    # Consumo por hora (ton/h)
    df['consumo_por_hora'] = df['consumo_ton'] / df['duration'].replace(0, np.nan)
    
    # Consumo por tonelada de displacement (ton combustível / 1000 ton displacement)
    df['consumo_por_displacement'] = (df['consumo_ton'] / df['displacement'].replace(0, np.nan)) * 1000
    
    # Eficiência de transporte: distância / consumo (milhas por tonelada)
    df['eficiencia_transporte'] = df['distance'] / df['consumo_ton'].replace(0, np.nan)
    
    # Velocidade real vs consumo (eficiência de velocidade)
    df['consumo_por_velocidade'] = df['consumo_ton'] / df['speed'].replace(0, np.nan)
    
    # =========================================
    # AGREGAÇÃO POR NAVIO (RESUMO GERAL)
    # =========================================
    eficiencia_navio = df.groupby(['shipName', 'Classe']).agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'consumo_por_displacement': 'mean',
        'eficiencia_transporte': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum',
        'duration': 'sum'
    }).round(4).reset_index()
    
    # Ranking de eficiência
    eficiencia_navio['ranking_eficiencia'] = eficiencia_navio['eficiencia_transporte'].rank(ascending=False).astype(int)
    eficiencia_navio = eficiencia_navio.sort_values('ranking_eficiencia')
    
    # Adiciona TOTAL
    total = {
        'shipName': 'TOTAL_FROTA',
        'Classe': 'TODAS',
        'consumo_por_milha': eficiencia_navio['consumo_por_milha'].mean(),
        'consumo_por_hora': eficiencia_navio['consumo_por_hora'].mean(),
        'consumo_por_displacement': eficiencia_navio['consumo_por_displacement'].mean(),
        'eficiencia_transporte': eficiencia_navio['eficiencia_transporte'].mean(),
        'consumo_ton': eficiencia_navio['consumo_ton'].sum(),
        'distance': eficiencia_navio['distance'].sum(),
        'duration': eficiencia_navio['duration'].sum(),
        'ranking_eficiencia': '-'
    }
    eficiencia_navio = pd.concat([eficiencia_navio, pd.DataFrame([total])], ignore_index=True)
    
    eficiencia_navio.to_csv(OUTPUT_DIR / "eficiencia_energetica.csv", index=False)
    
    # =========================================
    # AGREGAÇÃO POR NAVIO POR MÊS
    # =========================================
    logger.debug("📊 Calculando eficiência por navio por MÊS...")
    
    eficiencia_mensal = df.groupby(['shipName', 'Classe', 'ano', 'mes']).agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'consumo_por_displacement': 'mean',
        'eficiencia_transporte': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum',
        'duration': 'sum'
    }).round(4).reset_index()
    
    # Adiciona TOTAL_FROTA por mês
    total_mensal = df.groupby(['ano', 'mes']).agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'consumo_por_displacement': 'mean',
        'eficiencia_transporte': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum',
        'duration': 'sum'
    }).round(4).reset_index()
    total_mensal['shipName'] = 'TOTAL_FROTA'
    total_mensal['Classe'] = 'TODAS'
    
    eficiencia_mensal = pd.concat([eficiencia_mensal, total_mensal], ignore_index=True)
    eficiencia_mensal = eficiencia_mensal.sort_values(['ano', 'mes', 'shipName']).reset_index(drop=True)
    
    logger.debug(f"✅ {len(eficiencia_mensal)} registros (navio × mês)")
    
    # =========================================
    # AGREGAÇÃO POR NAVIO POR ANO
    # =========================================
    logger.info("📊 Calculando eficiência por navio por ANO...")
    
    eficiencia_anual = df.groupby(['shipName', 'Classe', 'ano']).agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'consumo_por_displacement': 'mean',
        'eficiencia_transporte': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum',
        'duration': 'sum'
    }).round(4).reset_index()
    
    # Adiciona TOTAL_FROTA por ano
    total_anual = df.groupby(['ano']).agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'consumo_por_displacement': 'mean',
        'eficiencia_transporte': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum',
        'duration': 'sum'
    }).round(4).reset_index()
    total_anual['shipName'] = 'TOTAL_FROTA'
    total_anual['Classe'] = 'TODAS'
    
    eficiencia_anual = pd.concat([eficiencia_anual, total_anual], ignore_index=True)
    eficiencia_anual = eficiencia_anual.sort_values(['ano', 'shipName']).reset_index(drop=True)
    
    logger.debug(f"✅ {len(eficiencia_anual)} registros (navio × ano)")
    
    return df, eficiencia_navio, eficiencia_mensal, eficiencia_anual


def calcular_metricas_bioincrustacao(df):
    """
    2. INDICADORES DE BIOINCRUSTAÇÃO
    """
    df = df.copy()
    
    # Consumo baseline (primeiros 90 dias após docagem)
    df_baseline = df[df['dias_desde_docagem'] <= 90].groupby('shipName').agg({
        'consumo_por_milha': 'mean'
    }).reset_index()
    df_baseline.columns = ['shipName', 'consumo_baseline']
    
    df = df.merge(df_baseline, on='shipName', how='left')
    
    # Desvio de consumo (% acima do baseline)
    df['desvio_consumo_pct'] = ((df['consumo_por_milha'] - df['consumo_baseline']) / df['consumo_baseline']) * 100
    
    # Índice de resistência hidrodinâmica estimado
    # (consumo atual / consumo baseline) - quanto maior, mais resistência
    df['indice_resistencia'] = df['consumo_por_milha'] / df['consumo_baseline']
    
    # Faixa de dias desde docagem para análise
    bins = [0, 90, 180, 365, 730, 1095, float('inf')]
    labels = ['0-90 dias', '91-180 dias', '181-365 dias', '1-2 anos', '2-3 anos', '+3 anos']
    df['faixa_docagem'] = pd.cut(df['dias_desde_docagem'], bins=bins, labels=labels)
    
    # Análise por faixa de tempo desde docagem
    bioincrustacao_tempo = df.groupby('faixa_docagem').agg({
        'consumo_por_milha': 'mean',
        'desvio_consumo_pct': 'mean',
        'indice_resistencia': 'mean',
        'consumo_ton': 'count'
    }).reset_index()
    bioincrustacao_tempo.columns = ['faixa_docagem', 'consumo_medio', 'desvio_pct', 'indice_resistencia', 'num_viagens']
    
    # Análise por navio
    bioincrustacao_navio = df.groupby(['shipName', 'Classe']).agg({
        'dias_desde_docagem': 'mean',
        'consumo_baseline': 'first',
        'consumo_por_milha': 'mean',
        'desvio_consumo_pct': 'mean',
        'indice_resistencia': 'mean'
    }).round(4).reset_index()
    
    bioincrustacao_navio['status'] = bioincrustacao_navio['desvio_consumo_pct'].apply(
        lambda x: '🔴 CRÍTICO' if x > 15 else ('🟡 ATENÇÃO' if x > 5 else '🟢 OK')
    )
    
    bioincrustacao_navio = bioincrustacao_navio.sort_values('desvio_consumo_pct', ascending=False)
    
    # Total
    total = {
        'shipName': 'TOTAL_FROTA',
        'Classe': 'TODAS',
        'dias_desde_docagem': bioincrustacao_navio['dias_desde_docagem'].mean(),
        'consumo_baseline': bioincrustacao_navio['consumo_baseline'].mean(),
        'consumo_por_milha': bioincrustacao_navio['consumo_por_milha'].mean(),
        'desvio_consumo_pct': bioincrustacao_navio['desvio_consumo_pct'].mean(),
        'indice_resistencia': bioincrustacao_navio['indice_resistencia'].mean(),
        'status': '-'
    }
    bioincrustacao_navio = pd.concat([bioincrustacao_navio, pd.DataFrame([total])], ignore_index=True)
    
    return df, bioincrustacao_navio, bioincrustacao_tempo


def calcular_metricas_economicas(df):
    """
    3. IMPACTO ECONÔMICO
    """
    print("\n" + "="*70)
    print("3️⃣  IMPACTO ECONÔMICO")
    print("="*70)
    
    df = df.copy()
    
    # Custo do combustível (USD)
    df['custo_combustivel_usd'] = df['consumo_ton'] * PRECO_LSHFO
    
    # Custo em BRL
    df['custo_combustivel_brl'] = df['custo_combustivel_usd'] * USD_TO_BRL
    
    # Custo por milha (USD/nm)
    df['custo_por_milha_usd'] = df['custo_combustivel_usd'] / df['distance'].replace(0, np.nan)
    
    # Custo adicional por bioincrustação
    # (diferença entre consumo atual e baseline × preço)
    df['consumo_adicional'] = (df['consumo_por_milha'] - df['consumo_baseline']) * df['distance']
    df['consumo_adicional'] = df['consumo_adicional'].clip(lower=0)  # Só positivo
    df['custo_adicional_bioincrustacao_usd'] = df['consumo_adicional'] * PRECO_LSHFO
    df['custo_adicional_bioincrustacao_brl'] = df['custo_adicional_bioincrustacao_usd'] * USD_TO_BRL
    
    # Agregação por navio
    economico_navio = df.groupby(['shipName', 'Classe']).agg({
        'custo_combustivel_usd': 'sum',
        'custo_combustivel_brl': 'sum',
        'custo_por_milha_usd': 'mean',
        'custo_adicional_bioincrustacao_usd': 'sum',
        'custo_adicional_bioincrustacao_brl': 'sum',
        'consumo_ton': 'sum',
        'distance': 'sum'
    }).round(2).reset_index()
    
    # Percentual do custo devido à bioincrustação
    economico_navio['pct_custo_bioincrustacao'] = (
        economico_navio['custo_adicional_bioincrustacao_usd'] / 
        economico_navio['custo_combustivel_usd'] * 100
    ).round(2)
    
    economico_navio = economico_navio.sort_values('custo_adicional_bioincrustacao_usd', ascending=False)
    
    # Total
    total = {
        'shipName': 'TOTAL_FROTA',
        'Classe': 'TODAS',
        'custo_combustivel_usd': economico_navio['custo_combustivel_usd'].sum(),
        'custo_combustivel_brl': economico_navio['custo_combustivel_brl'].sum(),
        'custo_por_milha_usd': economico_navio['custo_por_milha_usd'].mean(),
        'custo_adicional_bioincrustacao_usd': economico_navio['custo_adicional_bioincrustacao_usd'].sum(),
        'custo_adicional_bioincrustacao_brl': economico_navio['custo_adicional_bioincrustacao_brl'].sum(),
        'consumo_ton': economico_navio['consumo_ton'].sum(),
        'distance': economico_navio['distance'].sum(),
        'pct_custo_bioincrustacao': (
            economico_navio['custo_adicional_bioincrustacao_usd'].sum() /
            economico_navio['custo_combustivel_usd'].sum() * 100
        )
    }
    economico_navio = pd.concat([economico_navio, pd.DataFrame([total])], ignore_index=True)
    
    print("\n📊 Impacto Econômico por Navio:")
    print(economico_navio[['shipName', 'Classe', 'custo_combustivel_brl', 
                           'custo_adicional_bioincrustacao_brl', 'pct_custo_bioincrustacao']].to_string(index=False))
    
    # Agregação por ano
    economico_anual = df.groupby('ano').agg({
        'custo_combustivel_usd': 'sum',
        'custo_combustivel_brl': 'sum',
        'custo_adicional_bioincrustacao_usd': 'sum',
        'custo_adicional_bioincrustacao_brl': 'sum'
    }).round(2).reset_index()
    
    economico_anual['pct_custo_bioincrustacao'] = (
        economico_anual['custo_adicional_bioincrustacao_usd'] / 
        economico_anual['custo_combustivel_usd'] * 100
    ).round(2)
    
    print("\n📊 Impacto Econômico por Ano:")
    print(economico_anual.to_string(index=False))
    
    economico_navio.to_csv(OUTPUT_DIR / "impacto_economico_navio.csv", index=False)
    economico_anual.to_csv(OUTPUT_DIR / "impacto_economico_anual.csv", index=False)
    
    return df, economico_navio, economico_anual


def calcular_metricas_ambientais(df):
    """
    4. IMPACTO AMBIENTAL (EMISSÕES)
    """
    print("\n" + "="*70)
    print("4️⃣  IMPACTO AMBIENTAL (EMISSÕES)")
    print("="*70)
    
    df = df.copy()
    
    # Emissões em kg (consumo em toneladas × fator × 1000)
    df['emissao_co2_kg'] = df['consumo_ton'] * EMISSAO_CO2_POR_TON * 1000
    df['emissao_sox_kg'] = df['consumo_ton'] * EMISSAO_SOX_POR_TON * 1000
    df['emissao_nox_kg'] = df['consumo_ton'] * EMISSAO_NOX_POR_TON * 1000
    
    # Emissões por milha
    df['co2_por_milha'] = df['emissao_co2_kg'] / df['distance'].replace(0, np.nan)
    
    # Emissões adicionais por bioincrustação
    df['co2_adicional_kg'] = df['consumo_adicional'] * EMISSAO_CO2_POR_TON * 1000
    
    # Agregação por navio
    ambiental_navio = df.groupby(['shipName', 'Classe']).agg({
        'emissao_co2_kg': 'sum',
        'emissao_sox_kg': 'sum',
        'emissao_nox_kg': 'sum',
        'co2_por_milha': 'mean',
        'co2_adicional_kg': 'sum',
        'distance': 'sum'
    }).round(2).reset_index()
    
    # Converte para toneladas
    ambiental_navio['emissao_co2_ton'] = ambiental_navio['emissao_co2_kg'] / 1000
    ambiental_navio['emissao_sox_ton'] = ambiental_navio['emissao_sox_kg'] / 1000
    ambiental_navio['emissao_nox_ton'] = ambiental_navio['emissao_nox_kg'] / 1000
    ambiental_navio['co2_adicional_ton'] = ambiental_navio['co2_adicional_kg'] / 1000
    
    ambiental_navio = ambiental_navio.sort_values('emissao_co2_ton', ascending=False)
    
    # Total
    total = {
        'shipName': 'TOTAL_FROTA',
        'Classe': 'TODAS',
        'emissao_co2_kg': ambiental_navio['emissao_co2_kg'].sum(),
        'emissao_sox_kg': ambiental_navio['emissao_sox_kg'].sum(),
        'emissao_nox_kg': ambiental_navio['emissao_nox_kg'].sum(),
        'co2_por_milha': ambiental_navio['co2_por_milha'].mean(),
        'co2_adicional_kg': ambiental_navio['co2_adicional_kg'].sum(),
        'distance': ambiental_navio['distance'].sum(),
        'emissao_co2_ton': ambiental_navio['emissao_co2_ton'].sum(),
        'emissao_sox_ton': ambiental_navio['emissao_sox_ton'].sum(),
        'emissao_nox_ton': ambiental_navio['emissao_nox_ton'].sum(),
        'co2_adicional_ton': ambiental_navio['co2_adicional_ton'].sum()
    }
    ambiental_navio = pd.concat([ambiental_navio, pd.DataFrame([total])], ignore_index=True)
    
    print("\n📊 Emissões por Navio (toneladas):")
    print(ambiental_navio[['shipName', 'Classe', 'emissao_co2_ton', 'emissao_sox_ton', 
                           'emissao_nox_ton', 'co2_adicional_ton']].to_string(index=False))
    
    # Por ano
    ambiental_anual = df.groupby('ano').agg({
        'emissao_co2_kg': 'sum',
        'emissao_sox_kg': 'sum',
        'emissao_nox_kg': 'sum',
        'co2_adicional_kg': 'sum'
    }).round(2).reset_index()
    
    ambiental_anual['emissao_co2_ton'] = ambiental_anual['emissao_co2_kg'] / 1000
    ambiental_anual['co2_adicional_ton'] = ambiental_anual['co2_adicional_kg'] / 1000
    
    print("\n📊 Emissões por Ano:")
    print(ambiental_anual[['ano', 'emissao_co2_ton', 'co2_adicional_ton']].to_string(index=False))
    
    ambiental_navio.to_csv(OUTPUT_DIR / "impacto_ambiental_navio.csv", index=False)
    ambiental_anual.to_csv(OUTPUT_DIR / "impacto_ambiental_anual.csv", index=False)
    
    return df, ambiental_navio, ambiental_anual


def calcular_metricas_operacionais(df):
    """
    5. PERFORMANCE OPERACIONAL
    """
    print("\n" + "="*70)
    print("5️⃣  PERFORMANCE OPERACIONAL")
    print("="*70)
    
    df = df.copy()
    
    # Eficiência por condição do mar (Beaufort)
    df['beaufort_num'] = df['beaufortScale'].fillna(3)
    
    performance_beaufort = df.groupby('beaufort_num').agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'speed': 'mean',
        'consumo_ton': 'count'
    }).round(4).reset_index()
    performance_beaufort.columns = ['beaufort', 'consumo_por_milha', 'consumo_por_hora', 
                                    'velocidade_media', 'num_viagens']
    
    print("\n📊 Performance por Condição do Mar (Beaufort):")
    print(performance_beaufort.to_string(index=False))
    
    # Performance por classe de navio
    performance_classe = df.groupby('Classe').agg({
        'consumo_por_milha': 'mean',
        'consumo_por_hora': 'mean',
        'eficiencia_transporte': 'mean',
        'speed': 'mean',
        'consumo_ton': 'sum',
        'distance': 'sum'
    }).round(4).reset_index()
    
    print("\n📊 Performance por Classe de Navio:")
    print(performance_classe.to_string(index=False))
    
    # Utilização da capacidade (displacement / porte bruto)
    df['utilizacao_capacidade'] = (df['displacement'] / df['Porte Bruto']).clip(0, 1)
    
    utilizacao_navio = df.groupby(['shipName', 'Classe']).agg({
        'utilizacao_capacidade': 'mean',
        'Porte Bruto': 'first',
        'displacement': 'mean'
    }).round(4).reset_index()
    
    utilizacao_navio = utilizacao_navio.sort_values('utilizacao_capacidade', ascending=False)
    
    # Total
    total = {
        'shipName': 'TOTAL_FROTA',
        'Classe': 'TODAS',
        'utilizacao_capacidade': utilizacao_navio['utilizacao_capacidade'].mean(),
        'Porte Bruto': utilizacao_navio['Porte Bruto'].sum(),
        'displacement': utilizacao_navio['displacement'].mean()
    }
    utilizacao_navio = pd.concat([utilizacao_navio, pd.DataFrame([total])], ignore_index=True)
    
    print("\n📊 Utilização da Capacidade por Navio:")
    print(utilizacao_navio.to_string(index=False))
    
    performance_beaufort.to_csv(OUTPUT_DIR / "performance_beaufort.csv", index=False)
    performance_classe.to_csv(OUTPUT_DIR / "performance_classe.csv", index=False)
    utilizacao_navio.to_csv(OUTPUT_DIR / "utilizacao_capacidade.csv", index=False)
    
    return df


def gerar_resumo_executivo(eficiencia, bioincrustacao, economico, ambiental):
    """
    Gera um resumo executivo com todas as métricas principais
    """
    print("\n" + "="*70)
    print("📋 RESUMO EXECUTIVO - MÉTRICAS DERIVADAS DO CONSUMO")
    print("="*70)
    
    total_efic = eficiencia[eficiencia['shipName'] == 'TOTAL_FROTA'].iloc[0]
    total_bio = bioincrustacao[bioincrustacao['shipName'] == 'TOTAL_FROTA'].iloc[0]
    total_econ = economico[economico['shipName'] == 'TOTAL_FROTA'].iloc[0]
    total_amb = ambiental[ambiental['shipName'] == 'TOTAL_FROTA'].iloc[0]
    
    resumo = {
        'metrica': [
            '--- EFICIÊNCIA ---',
            'Consumo Total (ton)',
            'Distância Total (milhas)',
            'Consumo Médio por Milha (ton/nm)',
            'Consumo Médio por Hora (ton/h)',
            '--- BIOINCRUSTAÇÃO ---',
            'Dias Médios desde Docagem',
            'Desvio Médio de Consumo (%)',
            'Índice de Resistência Médio',
            '--- ECONÔMICO ---',
            'Custo Total Combustível (R$)',
            'Custo Adicional Bioincrustação (R$)',
            '% Custo por Bioincrustação',
            '--- AMBIENTAL ---',
            'Emissões CO2 Total (ton)',
            'Emissões SOx Total (ton)',
            'Emissões NOx Total (ton)',
            'CO2 Adicional por Bioincrustação (ton)'
        ],
        'valor': [
            '',
            f"{total_efic['consumo_ton']:,.0f}",
            f"{total_efic['distance']:,.0f}",
            f"{total_efic['consumo_por_milha']:.4f}",
            f"{total_efic['consumo_por_hora']:.4f}",
            '',
            f"{total_bio['dias_desde_docagem']:.0f}",
            f"{total_bio['desvio_consumo_pct']:.2f}%",
            f"{total_bio['indice_resistencia']:.4f}",
            '',
            f"R$ {total_econ['custo_combustivel_brl']:,.2f}",
            f"R$ {total_econ['custo_adicional_bioincrustacao_brl']:,.2f}",
            f"{total_econ['pct_custo_bioincrustacao']:.2f}%",
            '',
            f"{total_amb['emissao_co2_ton']:,.0f}",
            f"{total_amb['emissao_sox_ton']:,.0f}",
            f"{total_amb['emissao_nox_ton']:,.0f}",
            f"{total_amb['co2_adicional_ton']:,.0f}"
        ]
    }
    
    resumo_df = pd.DataFrame(resumo)
    print(resumo_df.to_string(index=False))
    
    resumo_df.to_csv(OUTPUT_DIR / "resumo_executivo.csv", index=False)
    
    return resumo_df


def main():
    logger.info("📊 MÉTRICAS DERIVADAS DO CONSUMO DE COMBUSTÍVEL")
    
    # Carrega dados
    eventos, consumo, navios, docagens, revestimentos = carregar_dados()
    
    # Prepara dataset base
    df = preparar_dataset_base(eventos, consumo, navios, docagens)

    df, eficiencia, eficiencia_mensal, eficiencia_anual = calcular_metricas_eficiencia(df)
    df, bioincrustacao, bio_tempo = calcular_metricas_bioincrustacao(df)

    eficiencia_mensal.to_csv(OUTPUT_DIR / "eficiencia_por_navio_mensal.csv", index=False)
    eficiencia_anual.to_csv(OUTPUT_DIR / "eficiencia_por_navio_anual.csv", index=False)

    bio_tempo.to_csv(OUTPUT_DIR / "bioincrustacao_por_tempo.csv", index=False)
    bioincrustacao.to_csv(OUTPUT_DIR / "bioincrustacao_por_navio.csv", index=False)
    
    logger.info("✅ ANÁLISE CONCLUÍDA!")
    logger.info(f"📁 Arquivos salvos em: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

