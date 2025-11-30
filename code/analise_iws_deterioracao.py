#!/usr/bin/env python3
"""
Análise Cruzada: Relatórios IWS × Taxa de Deterioração

Este script cruza os dados de inspeção subaquática (IWS - In-Water Survey)
com as taxas de deterioração calculadas para entender o impacto real
da bioincrustação no consumo de combustível.
"""

import pandas as pd
import numpy as np
from loguru import logger
from pathlib import Path
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).parent.joinpath('..', 'data')
RESULTS_DIR = Path(__file__).parent / "results"


def load_data():
    """Carrega dados de IWS e deterioração"""
    logger.info("📂 Carregando dados...")
    
    # Relatórios IWS
    iws = pd.read_csv(DATA_DIR / "Relatorios IWS.csv")
    iws['Data'] = pd.to_datetime(iws['Data'], errors='coerce')
    iws['Embarcação'] = iws['Embarcação'].str.upper().str.strip()
    logger.debug(f"✅ Relatórios IWS: {len(iws)} registros")
    
    # Taxa de deterioração
    deterioracao = pd.read_csv(RESULTS_DIR / "deterioracao_por_periodo.csv")
    deterioracao['periodo_inicio'] = pd.to_datetime(deterioracao['periodo_inicio'])
    deterioracao['periodo_fim'] = pd.to_datetime(deterioracao['periodo_fim'])
    deterioracao['navio'] = deterioracao['navio'].str.upper().str.strip()
    logger.debug(f"✅ Deterioração: {len(deterioracao)} períodos")
    
    return iws, deterioracao


def parse_condicao(valor):
    """
    Normaliza valores de condição de bioincrustação para escala 0-1
    
    Escala NORMAM 401 (aproximada):
    - 0: Limpo
    - 1: Leve (até 10% de cobertura)
    - 2: Moderado (10-40% de cobertura)
    - 3: Severo (40-70% de cobertura)
    - 4: Muito severo (>70% de cobertura)
    
    Retorna valor normalizado entre 0 e 1
    """
    if pd.isna(valor):
        return np.nan
    
    # Se for string
    if isinstance(valor, str):
        valor = valor.strip().lower()
        
        # Trata valores como "70-80%"
        if '-' in valor and '%' in valor:
            # Extrai média do range
            try:
                partes = valor.replace('%', '').split('-')
                media = (float(partes[0]) + float(partes[1])) / 2
                return media / 100  # Normaliza para 0-1
            except:
                return np.nan
        
        # Trata valores como "50-60%" sem o %
        if '-' in valor:
            try:
                partes = valor.split('-')
                media = (float(partes[0]) + float(partes[1])) / 2
                if media > 1:
                    return media / 100
                return media
            except:
                pass
        
        # Trata "não avaliado", "não consta", etc.
        if 'não' in valor or 'norman' in valor:
            return np.nan
        
        # Tenta converter para número
        try:
            valor = float(valor)
        except:
            return np.nan
    
    # Converte para float
    try:
        valor = float(valor)
    except:
        return np.nan
    
    # Se valor > 1, assume que é porcentagem ou nível NORMAM
    if valor > 1:
        if valor <= 4:
            # Escala NORMAM (0-4) → normaliza para 0-1
            return valor / 4
        else:
            # Porcentagem (0-100) → normaliza para 0-1
            return valor / 100
    
    return valor


def preparar_iws(iws):
    """Prepara e normaliza dados IWS"""
    logger.info("🔧 Preparando dados IWS...")
    
    df = iws.copy()
    
    # Normaliza condições
    df['condicao_geral_norm'] = df['Condição geral da embarcação'].apply(parse_condicao)
    df['condicao_fundo_norm'] = df['Condição do fundo chato'].apply(parse_condicao)
    df['condicao_costado_norm'] = df['Condição do costado'].apply(parse_condicao)
    df['condicao_helice_norm'] = df['Condição do hélice'].apply(parse_condicao)
    
    # Score médio de bioincrustação (média das condições disponíveis)
    cols_condicao = ['condicao_geral_norm', 'condicao_fundo_norm', 
                     'condicao_costado_norm', 'condicao_helice_norm']
    df['score_bioincrustacao'] = df[cols_condicao].mean(axis=1, skipna=True)
    
    # Classifica tipo de incrustação
    def classificar_tipo(texto):
        if pd.isna(texto):
            return 'desconhecido'
        texto = str(texto).lower()
        
        # Incrustações duras (mais impactantes)
        if 'craca' in texto or 'dura' in texto or 'calcárea' in texto:
            return 'dura'
        # Incrustações moles (menos impactantes)
        elif 'alga' in texto or 'limo' in texto or 'mole' in texto:
            return 'mole'
        else:
            return 'mista'
    
    df['tipo_incrustacao_geral'] = df['Tipo de incrustação da embarcação'].apply(classificar_tipo)
    
    # Remove registros sem data válida
    df = df.dropna(subset=['Data'])
    
    # Ordena por navio e data
    df = df.sort_values(['Embarcação', 'Data']).reset_index(drop=True)
    
    logger.debug(f"✅ IWS preparado: {len(df)} registros válidos")
    
    return df


def associar_iws_com_deterioracao(iws, deterioracao):
    """
    Associa cada inspeção IWS com o período de deterioração correspondente
    """
    logger.info("🔗 Associando inspeções com períodos de deterioração...")
    
    resultados = []
    
    for _, inspecao in iws.iterrows():
        navio = inspecao['Embarcação']
        data_inspecao = inspecao['Data']
        
        # Busca período de deterioração correspondente
        periodos_navio = deterioracao[deterioracao['navio'] == navio]
        
        for _, periodo in periodos_navio.iterrows():
            inicio = periodo['periodo_inicio']
            fim = periodo['periodo_fim']
            
            # Verifica se a inspeção está dentro do período
            if inicio <= data_inspecao <= fim:
                # Calcula posição relativa no período (0 = início, 1 = fim)
                dias_total = (fim - inicio).days
                dias_desde_inicio = (data_inspecao - inicio).days
                posicao_relativa = dias_desde_inicio / dias_total if dias_total > 0 else 0
                
                resultados.append({
                    'navio': navio,
                    'data_inspecao': data_inspecao,
                    'local_inspecao': inspecao['Local de realização'],
                    'score_bioincrustacao': inspecao['score_bioincrustacao'],
                    'condicao_geral': inspecao['condicao_geral_norm'],
                    'condicao_fundo': inspecao['condicao_fundo_norm'],
                    'condicao_costado': inspecao['condicao_costado_norm'],
                    'condicao_helice': inspecao['condicao_helice_norm'],
                    'tipo_incrustacao': inspecao['tipo_incrustacao_geral'],
                    'periodo_inicio': inicio,
                    'periodo_fim': fim,
                    'dias_desde_docagem': dias_desde_inicio,
                    'posicao_relativa': posicao_relativa,
                    'taxa_deterioracao_mes': periodo['taxa_deterioracao_mes'],
                    'taxa_deterioracao_ano': periodo['taxa_deterioracao_ano'],
                    'aumento_percentual': periodo['aumento_percentual_periodo'],
                    'consumo_medio': periodo['consumo_medio'],
                    'r2': periodo['r2'],
                })
                break
    
    resultado_df = pd.DataFrame(resultados)
    logger.info(f"✅ {len(resultado_df)} inspeções associadas a períodos de deterioração")
    
    return resultado_df


def analisar_correlacoes(df_cruzado):
    """
    Analisa correlações entre bioincrustação e deterioração
    """
    logger.info("📊 Analisando correlações...")
    
    # Filtra apenas registros com dados válidos
    df_valido = df_cruzado.dropna(subset=['score_bioincrustacao', 'taxa_deterioracao_mes'])
    
    if len(df_valido) < 3:
        logger.warning("⚠️ Poucos dados para análise de correlação")
        return None
    
    correlacoes = {}
    
    # Correlação: Score de bioincrustação × Taxa de deterioração
    if len(df_valido) >= 3:
        corr, p_value = stats.pearsonr(
            df_valido['score_bioincrustacao'], 
            df_valido['taxa_deterioracao_mes']
        )
        correlacoes['score_vs_taxa'] = {
            'correlacao': round(corr, 4),
            'p_value': round(p_value, 4),
            'n_amostras': len(df_valido)
        }
        logger.debug(f"  Correlação Score × Taxa: {corr:.4f} (p={p_value:.4f})")
    
    # Correlação: Dias desde docagem × Score de bioincrustação
    corr2, p_value2 = stats.pearsonr(
        df_valido['dias_desde_docagem'], 
        df_valido['score_bioincrustacao']
    )
    correlacoes['dias_vs_score'] = {
        'correlacao': round(corr2, 4),
        'p_value': round(p_value2, 4),
        'n_amostras': len(df_valido)
    }
    logger.debug(f"  Correlação Dias × Score: {corr2:.4f} (p={p_value2:.4f})")
    
    # Correlação: Score de bioincrustação × Consumo médio
    corr3, p_value3 = stats.pearsonr(
        df_valido['score_bioincrustacao'], 
        df_valido['consumo_medio']
    )
    correlacoes['score_vs_consumo'] = {
        'correlacao': round(corr3, 4),
        'p_value': round(p_value3, 4),
        'n_amostras': len(df_valido)
    }
    logger.debug(f"  Correlação Score × Consumo: {corr3:.4f} (p={p_value3:.4f})")
    
    return correlacoes


def analisar_por_tipo_incrustacao(df_cruzado):
    """
    Analisa impacto por tipo de incrustação
    """
    logger.info("📊 Analisando por tipo de incrustação...")
    
    df = df_cruzado.dropna(subset=['taxa_deterioracao_mes'])
    
    analise = df.groupby('tipo_incrustacao').agg({
        'taxa_deterioracao_mes': ['mean', 'std', 'count'],
        'score_bioincrustacao': 'mean',
        'consumo_medio': 'mean',
        'aumento_percentual': 'mean'
    }).round(4)
    
    analise.columns = ['taxa_media', 'taxa_std', 'n_inspecoes', 
                       'score_medio', 'consumo_medio', 'aumento_medio']
    analise = analise.reset_index()
    
    return analise


def gerar_insights(df_cruzado, correlacoes, analise_tipo):
    """
    Gera insights em linguagem natural
    """
    logger.info("💡 Gerando insights...")
    
    insights = []
    
    # Insight 1: Correlação geral
    if correlacoes and 'score_vs_taxa' in correlacoes:
        corr = correlacoes['score_vs_taxa']['correlacao']
        if corr > 0.5:
            insights.append(f"🔴 FORTE CORRELAÇÃO POSITIVA (r={corr:.3f}): Maior bioincrustação está FORTEMENTE associada a maior deterioração do consumo.")
        elif corr > 0.3:
            insights.append(f"🟠 CORRELAÇÃO MODERADA POSITIVA (r={corr:.3f}): Há evidência de que maior bioincrustação está associada a maior deterioração.")
        elif corr > 0:
            insights.append(f"🟡 CORRELAÇÃO FRACA POSITIVA (r={corr:.3f}): Há leve tendência de maior bioincrustação estar associada a maior deterioração.")
        elif corr < -0.3:
            insights.append(f"🔵 CORRELAÇÃO NEGATIVA (r={corr:.3f}): Resultado inesperado - pode indicar outros fatores dominantes ou viés nos dados.")
        else:
            insights.append(f"⚪ SEM CORRELAÇÃO CLARA (r={corr:.3f}): Outros fatores além da bioincrustação parecem dominar o consumo.")
    
    # Insight 2: Análise por tipo de incrustação
    if analise_tipo is not None and len(analise_tipo) > 0:
        # Encontra tipo com maior taxa
        tipo_max = analise_tipo.loc[analise_tipo['taxa_media'].idxmax()]
        tipo_min = analise_tipo.loc[analise_tipo['taxa_media'].idxmin()]
        
        if tipo_max['tipo_incrustacao'] == 'dura':
            insights.append(f"🦪 INCRUSTAÇÕES DURAS (cracas, calcáreas) apresentam MAIOR taxa de deterioração média ({tipo_max['taxa_media']:.4f} ton/nm/mês)")
        elif tipo_max['tipo_incrustacao'] == 'mole':
            insights.append(f"🌿 INCRUSTAÇÕES MOLES (algas, limo) apresentam MAIOR taxa de deterioração média ({tipo_max['taxa_media']:.4f} ton/nm/mês)")
        
        if tipo_min['taxa_media'] < tipo_max['taxa_media']:
            diff_percentual = ((tipo_max['taxa_media'] - tipo_min['taxa_media']) / abs(tipo_min['taxa_media'])) * 100 if tipo_min['taxa_media'] != 0 else float('inf')
            insights.append(f"📊 Diferença entre tipos: '{tipo_max['tipo_incrustacao']}' causa ~{diff_percentual:.0f}% mais deterioração que '{tipo_min['tipo_incrustacao']}'")
    
    # Insight 3: Progressão temporal
    if correlacoes and 'dias_vs_score' in correlacoes:
        corr_tempo = correlacoes['dias_vs_score']['correlacao']
        if corr_tempo > 0.3:
            insights.append(f"📈 PROGRESSÃO TEMPORAL CONFIRMADA (r={corr_tempo:.3f}): Bioincrustação aumenta claramente com o tempo desde a última docagem.")
        elif corr_tempo > 0:
            insights.append(f"📊 Tendência de aumento da bioincrustação ao longo do tempo (r={corr_tempo:.3f})")
    
    # Insight 4: Consumo direto
    if correlacoes and 'score_vs_consumo' in correlacoes:
        corr_consumo = correlacoes['score_vs_consumo']['correlacao']
        if corr_consumo > 0.3:
            insights.append(f"⛽ IMPACTO DIRETO NO CONSUMO (r={corr_consumo:.3f}): Maior bioincrustação correlacionada com maior consumo por milha náutica.")
    
    # Insight 5: Casos críticos
    if len(df_cruzado) > 0:
        criticos = df_cruzado[
            (df_cruzado['score_bioincrustacao'] > 0.5) & 
            (df_cruzado['taxa_deterioracao_mes'] > 0.001)
        ]
        if len(criticos) > 0:
            navios_criticos = criticos['navio'].unique()
            insights.append(f"⚠️ NAVIOS CRÍTICOS IDENTIFICADOS: {', '.join(navios_criticos[:5])} - Alta bioincrustação E alta deterioração")
    
    return insights


def gerar_resumo_por_navio(df_cruzado):
    """
    Gera resumo consolidado por navio
    """
    resumo = df_cruzado.groupby('navio').agg({
        'score_bioincrustacao': ['mean', 'max', 'count'],
        'taxa_deterioracao_mes': 'first',
        'aumento_percentual': 'first',
        'consumo_medio': 'first',
        'tipo_incrustacao': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'desconhecido'
    }).round(4)
    
    resumo.columns = ['score_medio', 'score_max', 'n_inspecoes', 
                      'taxa_deterioracao', 'aumento_percentual', 'consumo_medio', 
                      'tipo_predominante']
    resumo = resumo.reset_index()
    resumo = resumo.sort_values('taxa_deterioracao', ascending=False)
    
    return resumo


def main():
    logger.info("🚢 ANÁLISE CRUZADA: IWS × DETERIORAÇÃO")

    # 1. Carrega dados
    iws, deterioracao = load_data()
    
    # 2. Prepara dados IWS
    iws_preparado = preparar_iws(iws)
    
    # 3. Associa inspeções com períodos de deterioração
    df_cruzado = associar_iws_com_deterioracao(iws_preparado, deterioracao)
    
    if len(df_cruzado) == 0:
        logger.error("❌ Nenhuma inspeção associada a período de deterioração!")
        return
    
    # 4. Analisa correlações
    correlacoes = analisar_correlacoes(df_cruzado)
    
    # 5. Analisa por tipo de incrustação
    analise_tipo = analisar_por_tipo_incrustacao(df_cruzado)
    
    # 7. Gera resumo por navio
    resumo_navio = gerar_resumo_por_navio(df_cruzado)
    
    # 8. Salva resultados
    output_dir = RESULTS_DIR
    output_dir.mkdir(exist_ok=True)
    
    df_cruzado.to_csv(output_dir / "iws_deterioracao_cruzado.csv", index=False)
    logger.success(f"💾 Salvos: iws_deterioracao_cruzado.csv")
    
    analise_tipo.to_csv(output_dir / "iws_analise_por_tipo.csv", index=False)
    logger.success(f"💾 Salvos: iws_analise_por_tipo.csv")
    
    resumo_navio.to_csv(output_dir / "iws_resumo_por_navio.csv", index=False)
    logger.success(f"💾 Salvos: iws_resumo_por_navio.csv")
    
    
    logger.success(f"💾 Salvos: INSIGHTS_IWS_DETERIORACAO.txt")
    
    logger.info("✅ ANÁLISE CRUZADA CONCLUÍDA!")
    logger.info(f"📁 Resultados salvos em: {output_dir}")


if __name__ == "__main__":
    main()

