#!/usr/bin/env python3
"""
Análise de Deterioração do Casco

Calcula a taxa de deterioração do casco de cada embarcação baseada no aumento
do consumo de combustível ao longo do tempo entre docagens.

A taxa de deterioração é calculada através de regressão linear do consumo por
milha náutica em função do tempo, apenas durante períodos de navegação.
"""

import pandas as pd
import numpy as np
from loguru import logger
from pathlib import Path
from sklearn.linear_model import LinearRegression
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).parent.joinpath('..', '..', 'data')


def load_data():
    """Carrega todos os dados necessários"""
    logger.info("📂 Carregando dados...")
    
    # 1. Docagens - histórico de limpezas
    docagens = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Lista de docagens.csv")
    docagens['Docagem'] = pd.to_datetime(docagens['Docagem'], errors='coerce')
    docagens = docagens.dropna(subset=['Docagem'])
    docagens = docagens.sort_values(['Navio', 'Docagem'])
    logger.debug(f"✅ Docagens: {len(docagens)} registros")
    
    # 2. Consumo - quantidade consumida por sessão
    consumo = pd.read_csv(DATA_DIR / "ResultadoQueryConsumo.csv")
    logger.debug(f"✅ Consumo: {len(consumo):,} registros")
    
    # 3. Eventos - para obter datas e nome do navio
    eventos = pd.read_csv(DATA_DIR / "ResultadoQueryEventos.csv")
    eventos['startGMTDate'] = pd.to_datetime(eventos['startGMTDate'], errors='coerce')
    eventos['endGMTDate'] = pd.to_datetime(eventos['endGMTDate'], errors='coerce')
    logger.debug(f"✅ Eventos: {len(eventos):,} registros")
    
    # 4. Navios - características
    navios = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Dados navios.csv")
    logger.debug(f"✅ Navios: {len(navios)} embarcações")
    
    return docagens, consumo, eventos, navios


def prepare_navigation_data(consumo, eventos):
    """
    Prepara dataset apenas com dados de navegação e calcula consumo por milha
    """
    logger.info("🔗 Preparando dados de navegação...")
    
    # Agrupa consumo por sessão (soma todos os tipos de combustível)
    consumo_total = consumo.groupby('SESSION_ID')['CONSUMED_QUANTITY'].sum().reset_index()
    consumo_total.columns = ['sessionId', 'consumo_total']
    
    # Remove consumos nulos ou zero
    consumo_total = consumo_total[consumo_total['consumo_total'] > 0]
    
    # Merge com eventos
    df = eventos.merge(consumo_total, on='sessionId', how='inner')
    
    # Filtrar APENAS navegação (eventName = 'NAVEGACAO')
    df = df[df['eventName'] == 'NAVEGACAO'].copy()
    
    # Remove distâncias zero ou nulas
    df = df[(df['distance'].notna()) & (df['distance'] > 0)]
    
    # Normaliza nome do navio (uppercase e remove espaços)
    df['shipName'] = df['shipName'].str.upper().str.strip()
    
    # Calcula consumo por milha náutica
    df['consumo_por_milha'] = df['consumo_total'] / df['distance']
    
    # Remove outliers extremos (consumo por milha muito alto ou muito baixo)
    q1 = df['consumo_por_milha'].quantile(0.01)
    q99 = df['consumo_por_milha'].quantile(0.99)
    df = df[(df['consumo_por_milha'] >= q1) & (df['consumo_por_milha'] <= q99)]
    
    # Ordena por navio e data
    df = df.sort_values(['shipName', 'startGMTDate']).reset_index(drop=True)
    
    logger.debug(f"✅ Dataset de navegação: {len(df):,} registros")
    logger.debug(f"📅 Período: {df['startGMTDate'].min().date()} até {df['startGMTDate'].max().date()}")
    
    return df


def identificar_periodos_entre_docagens(df_navegacao, docagens):
    """
    Identifica períodos entre docagens para cada navio
    """
    logger.info("📊 Identificando períodos entre docagens...")
    
    periodos = []
    
    # Normaliza nomes nos dados de docagem
    docagens['Navio'] = docagens['Navio'].str.upper().str.strip()
    
    # Lista de navios únicos
    navios_unicos = df_navegacao['shipName'].unique()
    
    for navio in navios_unicos:
        # Filtra navegação deste navio
        df_navio = df_navegacao[df_navegacao['shipName'] == navio].copy()
        
        # Pega docagens deste navio
        docagens_navio = docagens[docagens['Navio'] == navio]['Docagem'].sort_values().tolist()
        
        # Data mínima e máxima de navegação
        data_min = df_navio['startGMTDate'].min()
        data_max = df_navio['startGMTDate'].max()
        
        if len(docagens_navio) == 0:
            # Navio sem docagem registrada - usa todo o período
            periodos.append({
                'navio': navio,
                'periodo_inicio': data_min,
                'periodo_fim': data_max,
                'tem_docagem': False,
                'numero_periodo': 1
            })
            logger.debug(f"  {navio}: SEM DOCAGEM - período completo")
            
        elif len(docagens_navio) == 1:
            # Uma docagem - calcula antes e depois
            data_docagem = docagens_navio[0]
            
            # Período APÓS a docagem até a data mais recente
            periodos.append({
                'navio': navio,
                'periodo_inicio': data_docagem,
                'periodo_fim': data_max,
                'tem_docagem': True,
                'numero_periodo': 1,
                'data_docagem': data_docagem
            })
            logger.debug(f"  {navio}: 1 DOCAGEM ({data_docagem.date()}) - 1 período após")
            
        else:
            # Múltiplas docagens - divide em períodos entre docagens
            for i in range(len(docagens_navio)):
                if i == 0:
                    # Primeiro período: da primeira docagem até a segunda
                    if len(docagens_navio) > 1:
                        periodos.append({
                            'navio': navio,
                            'periodo_inicio': docagens_navio[i],
                            'periodo_fim': docagens_navio[i + 1],
                            'tem_docagem': True,
                            'numero_periodo': i + 1,
                            'data_docagem': docagens_navio[i]
                        })
                    else:
                        # Só tem uma docagem, então período até data_max
                        periodos.append({
                            'navio': navio,
                            'periodo_inicio': docagens_navio[i],
                            'periodo_fim': data_max,
                            'tem_docagem': True,
                            'numero_periodo': i + 1,
                            'data_docagem': docagens_navio[i]
                        })
                else:
                    # Períodos intermediários e último
                    if i < len(docagens_navio) - 1:
                        # Período intermediário
                        periodos.append({
                            'navio': navio,
                            'periodo_inicio': docagens_navio[i],
                            'periodo_fim': docagens_navio[i + 1],
                            'tem_docagem': True,
                            'numero_periodo': i + 1,
                            'data_docagem': docagens_navio[i]
                        })
                    else:
                        # Último período: da última docagem até data_max
                        periodos.append({
                            'navio': navio,
                            'periodo_inicio': docagens_navio[i],
                            'periodo_fim': data_max,
                            'tem_docagem': True,
                            'numero_periodo': i + 1,
                            'data_docagem': docagens_navio[i]
                        })
            
            logger.debug(f"  {navio}: {len(docagens_navio)} DOCAGENS - {len(docagens_navio)} períodos")
    
    logger.info(f"✅ Total de períodos identificados: {len(periodos)}")
    
    return pd.DataFrame(periodos)


def calcular_taxa_deterioracao(df_navegacao, periodos_df):
    """
    Calcula a taxa de deterioração do casco para cada período usando regressão linear
    """
    logger.info("🤖 Calculando taxa de deterioração por período...")
    
    resultados = []
    
    for idx, periodo in periodos_df.iterrows():
        navio = periodo['navio']
        inicio = periodo['periodo_inicio']
        fim = periodo['periodo_fim']
        
        # Filtra dados de navegação deste período
        mask = (
            (df_navegacao['shipName'] == navio) &
            (df_navegacao['startGMTDate'] >= inicio) &
            (df_navegacao['startGMTDate'] <= fim)
        )
        df_periodo = df_navegacao[mask].copy()
        
        # Precisa de pelo menos 5 registros para fazer regressão
        if len(df_periodo) < 5:
            logger.warning(f"  ⚠️ {navio} - Período {periodo['numero_periodo']}: poucos dados ({len(df_periodo)} registros)")
            continue
        
        # Criar variável temporal (dias desde o início do período)
        df_periodo['dias_desde_inicio'] = (
            df_periodo['startGMTDate'] - inicio
        ).dt.total_seconds() / (24 * 3600)
        
        # Prepara dados para regressão
        X = df_periodo[['dias_desde_inicio']].values
        y = df_periodo['consumo_por_milha'].values
        
        # Treina modelo de regressão linear
        modelo = LinearRegression()
        modelo.fit(X, y)
        
        # Previsões
        y_pred = modelo.predict(X)
        
        # Métricas
        r2 = 1 - (np.sum((y - y_pred) ** 2) / np.sum((y - np.mean(y)) ** 2))
        mae = np.mean(np.abs(y - y_pred))
        rmse = np.sqrt(np.mean((y - y_pred) ** 2))
        
        # Taxa de deterioração (coeficiente angular)
        # Convertendo para aumento percentual por dia e por mês
        taxa_por_dia = modelo.coef_[0]
        taxa_por_mes = taxa_por_dia * 30
        taxa_por_ano = taxa_por_dia * 365
        
        # Consumo inicial e final do período
        consumo_inicial = modelo.predict([[0]])[0]
        dias_periodo = (fim - inicio).days
        consumo_final = modelo.predict([[dias_periodo]])[0]
        aumento_percentual = ((consumo_final - consumo_inicial) / consumo_inicial) * 100 if consumo_inicial > 0 else 0
        
        # Estatísticas do período
        consumo_medio = df_periodo['consumo_por_milha'].mean()
        consumo_std = df_periodo['consumo_por_milha'].std()
        distancia_total = df_periodo['distance'].sum()
        consumo_total = df_periodo['consumo_total'].sum()
        
        resultados.append({
            'navio': navio,
            'numero_periodo': periodo['numero_periodo'],
            'tem_docagem': periodo['tem_docagem'],
            'data_docagem': periodo.get('data_docagem', None),
            'periodo_inicio': inicio,
            'periodo_fim': fim,
            'dias_periodo': dias_periodo,
            'num_registros': len(df_periodo),
            
            # Taxa de deterioração
            'taxa_deterioracao_dia': round(taxa_por_dia, 6),
            'taxa_deterioracao_mes': round(taxa_por_mes, 6),
            'taxa_deterioracao_ano': round(taxa_por_ano, 6),
            
            # Consumo
            'consumo_inicial_estimado': round(consumo_inicial, 4),
            'consumo_final_estimado': round(consumo_final, 4),
            'aumento_percentual_periodo': round(aumento_percentual, 2),
            'consumo_medio': round(consumo_medio, 4),
            'consumo_std': round(consumo_std, 4),
            
            # Métricas do modelo
            'r2': round(r2, 4),
            'mae': round(mae, 4),
            'rmse': round(rmse, 4),
            
            # Estatísticas operacionais
            'distancia_total_nm': round(distancia_total, 2),
            'consumo_total_ton': round(consumo_total, 2),
        })
        
        tendencia = "📈 AUMENTANDO" if taxa_por_dia > 0 else "📉 DIMINUINDO"
        logger.debug(f"  ✅ {navio} - Período {periodo['numero_periodo']}: {tendencia} {taxa_por_mes:.6f} ton/nm/mês (R² = {r2:.3f})")
    
    resultados_df = pd.DataFrame(resultados)
    
    logger.info(f"✅ Taxas de deterioração calculadas para {len(resultados)} períodos")
    
    return resultados_df


def main():
    logger.info("🚢 ANÁLISE DE DETERIORAÇÃO DO CASCO")
    
    # 1. Carrega dados
    docagens, consumo, eventos, navios = load_data()
    
    # 2. Prepara dados de navegação
    df_navegacao = prepare_navigation_data(consumo, eventos)
    
    # 3. Identifica períodos entre docagens
    periodos_df = identificar_periodos_entre_docagens(df_navegacao, docagens)
    
    # 4. Calcula taxa de deterioração
    resultados_df = calcular_taxa_deterioracao(df_navegacao, periodos_df)
    
    # 7. Salva resultados
    output_dir = Path(__file__).parent / "results"
    output_dir.mkdir(exist_ok=True)
    
    resultados_df.to_csv(output_dir / "deterioracao_por_periodo.csv", index=False)
    logger.success(f"💾 Salvos: deterioracao_por_periodo.csv")
    
    logger.info("✅ ANÁLISE CONCLUÍDA!")
    logger.info(f"📁 Resultados salvos em: {output_dir}")


if __name__ == "__main__":
    main()

