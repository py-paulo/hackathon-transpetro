#!/usr/bin/env python3

import pandas as pd
import numpy as np
from loguru import logger
from pathlib import Path
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).parent.joinpath('..', '..', 'data')

def load_data():
    logger.info("📂 Carregando dados...")
    
    # 1. Navios - características
    navios = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Dados navios.csv")
    logger.debug(f"✅ Navios: {len(navios)} embarcações")
    
    # 2. Docagens - histórico de limpezas
    docagens = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Lista de docagens.csv")
    docagens['Docagem'] = pd.to_datetime(docagens['Docagem'])
    logger.debug(f"✅ Docagens: {len(docagens)} registros")
    
    # 3. Consumo - quantidade consumida por sessão
    consumo = pd.read_csv(DATA_DIR / "ResultadoQueryConsumo.csv")
    logger.debug(f"✅ Consumo: {len(consumo):,} registros")
    
    # 4. Eventos - para obter datas e nome do navio
    eventos = pd.read_csv(DATA_DIR / "ResultadoQueryEventos.csv")
    eventos['startGMTDate'] = pd.to_datetime(eventos['startGMTDate'])
    logger.debug(f"✅ Eventos: {len(eventos):,} registros")

    revestimentos = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Especificacao revestimento.csv")
    
    return navios, docagens, consumo, eventos, revestimentos

def prepare_dataset(consumo, eventos, navios):
    """
    Faz o merge dos dados e prepara para análise.
    """
    logger.info("🔗 Preparando dataset...")
    
    # Agrupa consumo por sessão (soma todos os tipos de combustível)
    consumo_total = consumo.groupby('SESSION_ID')['CONSUMED_QUANTITY'].sum().reset_index()
    consumo_total.columns = ['sessionId', 'consumo_total']
    
    # Remove consumos nulos ou zero
    consumo_total = consumo_total[consumo_total['consumo_total'] > 0]
    
    # Merge com eventos (para ter datas e nomes)
    df = eventos.merge(consumo_total, on='sessionId', how='inner')
    
    # Extrai ano e mês
    df['ano'] = df['startGMTDate'].dt.year
    df['mes'] = df['startGMTDate'].dt.month
    df['ano_mes'] = df['startGMTDate'].dt.to_period('M').astype(str)
    
    # Normaliza nome do navio
    df['shipName_upper'] = df['shipName'].str.upper().str.strip()
    navios['Nome_upper'] = navios['Nome do navio'].str.upper().str.strip()
    
    # Merge com características dos navios
    df = df.merge(navios, left_on='shipName_upper', right_on='Nome_upper', how='left')
    
    logger.debug(f"✅ Dataset final: {len(df):,} registros")
    logger.debug(f"📅 Período: {df['startGMTDate'].min().date()} até {df['startGMTDate'].max().date()}")
    
    return df


def add_total_line(df, colunas_soma, colunas_media=None, label='TOTAL'):
    """Adiciona linha de total ao DataFrame"""
    total_row = {'shipName': label}
    
    for col in colunas_soma:
        if col in df.columns:
            total_row[col] = df[col].sum()
    
    if colunas_media:
        for col in colunas_media:
            if col in df.columns:
                total_row[col] = df[col].mean()
    
    # Preenche colunas restantes
    for col in df.columns:
        if col not in total_row:
            total_row[col] = ''
    
    return pd.concat([df, pd.DataFrame([total_row])], ignore_index=True)


def calcular_consumo_mensal_por_navio(df):
    """Calcula consumo por NAVIO por MÊS"""
    logger.info("📊 CONSUMO POR NAVIO POR MÊS")
    
    # Agrupa por navio, ano e mês
    consumo_mensal = df.groupby(['shipName', 'Classe', 'ano', 'mes']).agg({
        'consumo_total': ['sum', 'mean', 'count'],
        'distance': 'sum',
        'duration': 'sum'
    }).round(2)
    
    consumo_mensal.columns = ['consumo_total', 'consumo_medio', 'num_viagens', 
                              'distancia_total', 'duracao_total']
    consumo_mensal = consumo_mensal.reset_index()
    
    # Consumo por milha navegada
    consumo_mensal['consumo_por_milha'] = (
        consumo_mensal['consumo_total'] / consumo_mensal['distancia_total']
    ).round(4)
    
    # Consumo por hora
    consumo_mensal['consumo_por_hora'] = (
        consumo_mensal['consumo_total'] / consumo_mensal['duracao_total']
    ).round(4)
    
    # Adiciona linha de TOTAL por mês
    total_mensal = df.groupby(['ano', 'mes']).agg({
        'consumo_total': ['sum', 'mean', 'count'],
        'distance': 'sum',
        'duration': 'sum'
    }).round(2)
    total_mensal.columns = ['consumo_total', 'consumo_medio', 'num_viagens',
                            'distancia_total', 'duracao_total']
    total_mensal = total_mensal.reset_index()
    total_mensal['shipName'] = 'TOTAL_FROTA'
    total_mensal['Classe'] = 'TODAS'
    total_mensal['consumo_por_milha'] = (
        total_mensal['consumo_total'] / total_mensal['distancia_total']
    ).round(4)
    total_mensal['consumo_por_hora'] = (
        total_mensal['consumo_total'] / total_mensal['duracao_total']
    ).round(4)
    
    # Concatena
    consumo_mensal = pd.concat([consumo_mensal, total_mensal], ignore_index=True)
    consumo_mensal = consumo_mensal.sort_values(['ano', 'mes', 'shipName']).reset_index(drop=True)
    
    # Mostra resumo
    logger.debug(f"Total de registros: {len(consumo_mensal)}")
    
    return consumo_mensal


def modelo_ml_tendencia_por_navio(df):
    """
    Modelo ML para prever tendência de consumo POR NAVIO.
    """
    logger.info("🤖 MODELO ML - TENDÊNCIA DE CONSUMO POR NAVIO")
    
    # Lista de navios
    navios = df['shipName'].unique()
    
    resultados = []
    previsoes_futuras = []
    
    for navio in navios:
        df_navio = df[df['shipName'] == navio].copy()
        
        # Agrupa por ano/mês
        consumo_mensal = df_navio.groupby(['ano', 'mes']).agg({
            'consumo_total': 'sum',
            'distance': 'sum'
        }).reset_index()
        
        consumo_mensal['consumo_por_milha'] = (
            consumo_mensal['consumo_total'] / consumo_mensal['distance']
        )
        
        # Remove valores infinitos ou NaN
        consumo_mensal = consumo_mensal.replace([np.inf, -np.inf], np.nan).dropna()
        
        if len(consumo_mensal) < 6:  # Mínimo de 6 meses para treinar
            continue
        
        # Prepara dados
        X = consumo_mensal[['ano', 'mes']].values
        y = consumo_mensal['consumo_por_milha'].values
        
        # Treina modelo
        modelo = LinearRegression()
        modelo.fit(X, y)
        
        # Previsões
        y_pred = modelo.predict(X)
        r2 = 1 - (np.sum((y - y_pred) ** 2) / np.sum((y - np.mean(y)) ** 2))
        
        # Tendência
        tendencia = "📈 SUBINDO" if modelo.coef_[0] > 0 else "📉 DESCENDO"
        
        resultados.append({
            'shipName': navio,
            'coef_ano': round(modelo.coef_[0], 6),
            'coef_mes': round(modelo.coef_[1], 6),
            'intercepto': round(modelo.intercept_, 6),
            'r2': round(r2, 4),
            'tendencia': tendencia,
            'meses_dados': len(consumo_mensal)
        })
        
        for i in range(1, 7):
            mes = 12 + i
            ano = 2025 + (mes - 1) // 12
            mes_real = ((mes - 1) % 12) + 1
            pred = modelo.predict([[ano, mes_real]])[0]
            previsoes_futuras.append({
                'shipName': navio,
                'ano': ano,
                'mes': mes_real,
                'consumo_por_milha_previsto': round(pred, 4)
            })
    
    resultados_df = pd.DataFrame(resultados)
    
    # Adiciona TOTAL (média da frota)
    total_row = {
        'shipName': 'TOTAL_FROTA',
        'coef_ano': resultados_df['coef_ano'].mean(),
        'coef_mes': resultados_df['coef_mes'].mean(),
        'intercepto': resultados_df['intercepto'].mean(),
        'r2': resultados_df['r2'].mean(),
        'tendencia': '📈 SUBINDO' if resultados_df['coef_ano'].mean() > 0 else '📉 DESCENDO',
        'meses_dados': resultados_df['meses_dados'].sum()
    }
    resultados_df = pd.concat([resultados_df, pd.DataFrame([total_row])], ignore_index=True)
    
    # Previsões
    previsoes_df = pd.DataFrame(previsoes_futuras)

    # Adiciona TOTAL (média) nas previsões
    total_previsoes = previsoes_df.groupby(['ano', 'mes']).agg({
        'consumo_por_milha_previsto': 'mean'
    }).reset_index()
    total_previsoes['shipName'] = 'TOTAL_FROTA'
    previsoes_df = pd.concat([previsoes_df, total_previsoes], ignore_index=True)
    previsoes_df = previsoes_df.sort_values(['ano', 'mes', 'shipName']).reset_index(drop=True)

    return resultados_df, previsoes_df


def modelo_ml_consumo_por_navio(df):
    """
    Modelo ML para prever consumo total considerando todas as features POR NAVIO.
    """
    logger.info("🤖 MODELO ML - PREVISÃO DE CONSUMO POR NAVIO")
    
    resultados = []
    navios = df['shipName'].unique()
    
    for navio in navios:
        df_navio = df[df['shipName'] == navio].copy()
        
        # Prepara features
        df_ml = df_navio[['ano', 'mes', 'distance', 'duration', 'consumo_total']].dropna()
        
        if len(df_ml) < 10:  # Mínimo de registros
            continue
        
        X = df_ml[['ano', 'mes', 'distance', 'duration']].values
        y = df_ml['consumo_total'].values
        
        # Treina
        modelo = LinearRegression()
        modelo.fit(X, y)
        
        y_pred = modelo.predict(X)
        mae = np.mean(np.abs(y - y_pred))
        r2 = 1 - (np.sum((y - y_pred) ** 2) / np.sum((y - np.mean(y)) ** 2))
        
        resultados.append({
            'shipName': navio,
            'mae_toneladas': round(mae, 2),
            'r2': round(r2, 4),
            'num_registros': len(df_ml),
            'consumo_medio_real': round(y.mean(), 2),
            'coef_distancia': round(modelo.coef_[2], 4),
            'coef_duracao': round(modelo.coef_[3], 4)
        })
    
    resultados_df = pd.DataFrame(resultados)
    
    # Adiciona TOTAL
    total_row = {
        'shipName': 'TOTAL_FROTA',
        'mae_toneladas': resultados_df['mae_toneladas'].mean(),
        'r2': resultados_df['r2'].mean(),
        'num_registros': resultados_df['num_registros'].sum(),
        'consumo_medio_real': resultados_df['consumo_medio_real'].mean(),
        'coef_distancia': resultados_df['coef_distancia'].mean(),
        'coef_duracao': resultados_df['coef_duracao'].mean()
    }
    resultados_df = pd.concat([resultados_df, pd.DataFrame([total_row])], ignore_index=True)
    
    return resultados_df


def main():
    logger.info("🚢 ANÁLISE DE CONSUMO DE COMBUSTÍVEL POR NAVIO")
    
    navios, _, consumo, eventos, revestimentos = load_data()
    
    df = prepare_dataset(consumo, eventos, navios)

    consumo_mensal = calcular_consumo_mensal_por_navio(df)

    output_dir = DATA_DIR / ".." / "code" / "scripts" / "results"
    output_dir.mkdir(exist_ok=True)

    consumo_mensal.to_csv(output_dir / "consumo_mensal_por_navio.csv", index=False)

    logger.info("✅ ANÁLISE CONCLUÍDA!")
    logger.info(f"📁 Resultados salvos em: {output_dir}")

if __name__ == "__main__":
    main()
