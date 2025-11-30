#!/usr/bin/env python3
"""
Sistema de Sugestão de Limpeza de Casco

Analisa múltiplos fatores para recomendar quando realizar limpeza:
- Taxa de deterioração do consumo
- Score de bioincrustação (IWS)
- Tempo desde última docagem
- Aumento percentual de consumo
- Análise de custo-benefício (ROI)

Gera recomendações priorizadas com justificativas.
"""

import pandas as pd
import numpy as np
from loguru import logger
from pathlib import Path
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).parent.joinpath('..', '..', 'data')
RESULTS_DIR = Path(__file__).parent / "results"
SCRIPTS_DIR = Path(__file__).parent


# ============================================
# CONFIGURAÇÕES E PARÂMETROS
# ============================================

# Limites para classificação de urgência
LIMITES = {
    'taxa_deterioracao_critica': 0.0015,  # ton/nm/mês
    'taxa_deterioracao_alta': 0.0010,
    'taxa_deterioracao_moderada': 0.0005,
    
    'score_iws_critico': 0.7,  # 70% de bioincrustação
    'score_iws_alto': 0.5,
    'score_iws_moderado': 0.3,
    
    'aumento_consumo_critico': 50,  # % de aumento
    'aumento_consumo_alto': 30,
    'aumento_consumo_moderado': 15,
    
    'dias_sem_docagem_critico': 1200,  # ~3.3 anos
    'dias_sem_docagem_alto': 900,  # ~2.5 anos
    'dias_sem_docagem_moderado': 600,  # ~1.6 anos
}

# Estimativas de custo (valores podem ser ajustados)
CUSTOS = {
    'limpeza_por_navio': {
        'Suezmax': 500000,  # R$ 500k
        'Aframax': 400000,  # R$ 400k
        'MR 2': 300000,     # R$ 300k
        'Gaseiro 7k': 200000,  # R$ 200k
        'default': 350000
    },
    'combustivel_por_tonelada': 3000,  # R$ 3.000/ton (bunker)
    'consumo_mensal_medio_nm': 10000,  # milhas náuticas/mês (estimativa)
}


# ============================================
# FUNÇÕES DE CARREGAMENTO
# ============================================

def load_data():
    """Carrega todos os dados necessários"""
    logger.info("📂 Carregando dados...")
    
    # Dados de deterioração
    deterioracao = pd.read_csv(RESULTS_DIR / "deterioracao_por_periodo.csv")
    deterioracao['periodo_fim'] = pd.to_datetime(deterioracao['periodo_fim'], errors='coerce')
    deterioracao['data_docagem'] = pd.to_datetime(deterioracao['data_docagem'], errors='coerce')
    
    # Resumo IWS por navio
    iws_resumo = pd.read_csv(RESULTS_DIR / "iws_resumo_por_navio.csv")
    
    # Dados cruzados IWS + Deterioração
    iws_deterioracao = pd.read_csv(RESULTS_DIR / "iws_deterioracao_cruzado.csv")
    iws_deterioracao['data_inspecao'] = pd.to_datetime(iws_deterioracao['data_inspecao'], errors='coerce')
    
    # Características dos navios
    navios = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Dados navios.csv")
    navios.columns = navios.columns.str.strip()
    navios['nome_normalizado'] = navios['Nome do navio'].str.upper().str.strip()
    
    # Docagens
    docagens = pd.read_csv(DATA_DIR / "Dados navios Hackathon_Lista de docagens.csv")
    docagens['Docagem'] = pd.to_datetime(docagens['Docagem'], errors='coerce')
    docagens['Navio'] = docagens['Navio'].str.upper().str.strip()
    
    logger.debug(f"✅ Deterioração: {len(deterioracao)} registros")
    logger.debug(f"✅ IWS Resumo: {len(iws_resumo)} navios")
    logger.debug(f"✅ Navios: {len(navios)} embarcações")
    
    return deterioracao, iws_resumo, iws_deterioracao, navios, docagens


# ============================================
# FUNÇÕES DE ANÁLISE
# ============================================

def calcular_dias_desde_docagem(navio, docagens, data_referencia=None):
    """Calcula dias desde a última docagem"""
    if data_referencia is None:
        data_referencia = datetime.now()
    
    docagens_navio = docagens[docagens['Navio'] == navio]['Docagem'].dropna()
    
    if len(docagens_navio) == 0:
        return None, None
    
    ultima_docagem = docagens_navio.max()
    dias = (data_referencia - ultima_docagem).days
    
    return dias, ultima_docagem


def calcular_custo_combustivel_extra(taxa_deterioracao_mes, dias_desde_docagem, consumo_medio):
    """
    Estima o custo adicional de combustível devido à deterioração.
    
    Fórmula:
    - Consumo extra = taxa_deterioracao × dias_desde_docagem / 30 × milhas_mensais
    - Custo = consumo_extra × preço_combustivel
    """
    if taxa_deterioracao_mes <= 0 or dias_desde_docagem is None:
        return 0, 0
    
    # Consumo extra por mês (em toneladas)
    consumo_extra_mensal = taxa_deterioracao_mes * CUSTOS['consumo_mensal_medio_nm']
    
    # Projeta para os próximos 6 meses
    meses_projecao = 6
    consumo_extra_total = consumo_extra_mensal * meses_projecao
    
    # Custo em R$
    custo_combustivel_extra = consumo_extra_total * CUSTOS['combustivel_por_tonelada']
    
    return custo_combustivel_extra, consumo_extra_total


def calcular_roi_limpeza(custo_limpeza, custo_combustivel_extra, consumo_extra_mensal):
    """
    Calcula o ROI (Return on Investment) de realizar a limpeza.
    
    ROI = (Economia de combustível - Custo de limpeza) / Custo de limpeza
    """
    if custo_limpeza <= 0:
        return None
    
    # Economia anual estimada (assumindo que limpeza reduz consumo ao nível inicial)
    economia_anual = consumo_extra_mensal * 12 * CUSTOS['combustivel_por_tonelada']
    
    # ROI em %
    roi = ((economia_anual - custo_limpeza) / custo_limpeza) * 100 if custo_limpeza > 0 else 0
    
    # Payback em meses
    payback_meses = (custo_limpeza / (consumo_extra_mensal * CUSTOS['combustivel_por_tonelada'])) if consumo_extra_mensal > 0 else None
    
    return {
        'roi_percentual': round(roi, 2),
        'economia_anual_estimada': round(economia_anual, 2),
        'payback_meses': round(payback_meses, 2) if payback_meses else None
    }


def classificar_urgencia(deterioracao, iws_score, aumento_percentual, dias_sem_docagem):
    """
    Classifica a urgência da limpeza baseado em múltiplos fatores.
    
    Retorna: 'CRÍTICA', 'ALTA', 'MODERADA', 'BAIXA', 'NÃO URGENTE'
    """
    score_urgencia = 0
    fatores = []
    
    # Fator 1: Taxa de deterioração
    if deterioracao >= LIMITES['taxa_deterioracao_critica']:
        score_urgencia += 3
        fatores.append('Taxa deterioração crítica')
    elif deterioracao >= LIMITES['taxa_deterioracao_alta']:
        score_urgencia += 2
        fatores.append('Taxa deterioração alta')
    elif deterioracao >= LIMITES['taxa_deterioracao_moderada']:
        score_urgencia += 1
        fatores.append('Taxa deterioração moderada')
    
    # Fator 2: Score IWS
    if pd.notna(iws_score):
        if iws_score >= LIMITES['score_iws_critico']:
            score_urgencia += 3
            fatores.append('Bioincrustação crítica')
        elif iws_score >= LIMITES['score_iws_alto']:
            score_urgencia += 2
            fatores.append('Bioincrustação alta')
        elif iws_score >= LIMITES['score_iws_moderado']:
            score_urgencia += 1
            fatores.append('Bioincrustação moderada')
    
    # Fator 3: Aumento percentual
    if pd.notna(aumento_percentual) and aumento_percentual > 0:
        if aumento_percentual >= LIMITES['aumento_consumo_critico']:
            score_urgencia += 2
            fatores.append('Aumento consumo crítico')
        elif aumento_percentual >= LIMITES['aumento_consumo_alto']:
            score_urgencia += 1.5
            fatores.append('Aumento consumo alto')
        elif aumento_percentual >= LIMITES['aumento_consumo_moderado']:
            score_urgencia += 1
            fatores.append('Aumento consumo moderado')
    
    # Fator 4: Tempo sem docagem
    if dias_sem_docagem:
        if dias_sem_docagem >= LIMITES['dias_sem_docagem_critico']:
            score_urgencia += 2
            fatores.append('Muito tempo sem docagem')
        elif dias_sem_docagem >= LIMITES['dias_sem_docagem_alto']:
            score_urgencia += 1.5
            fatores.append('Tempo sem docagem alto')
        elif dias_sem_docagem >= LIMITES['dias_sem_docagem_moderado']:
            score_urgencia += 1
            fatores.append('Tempo sem docagem moderado')
    
    # Classificação final
    if score_urgencia >= 6:
        return 'CRÍTICA', score_urgencia, fatores
    elif score_urgencia >= 4:
        return 'ALTA', score_urgencia, fatores
    elif score_urgencia >= 2.5:
        return 'MODERADA', score_urgencia, fatores
    elif score_urgencia >= 1:
        return 'BAIXA', score_urgencia, fatores
    else:
        return 'NÃO URGENTE', score_urgencia, fatores


def gerar_recomendacao(urgencia, navio, classe, dias_sem_docagem, taxa_deterioracao, 
                       iws_score, aumento_percentual, custo_limpeza, roi_data):
    """Gera texto de recomendação personalizado"""
    
    recomendacoes = {
        'CRÍTICA': f"🔴 **LIMPEZA URGENTE RECOMENDADA**\n\n"
                   f"O {navio} apresenta sinais críticos de deterioração. "
                   f"Recomenda-se agendar limpeza imediata (próximos 15-30 dias).",
        
        'ALTA': f"🟠 **LIMPEZA ALTAMENTE RECOMENDADA**\n\n"
                f"O {navio} apresenta deterioração significativa. "
                f"Recomenda-se agendar limpeza nos próximos 30-60 dias.",
        
        'MODERADA': f"🟡 **LIMPEZA RECOMENDADA**\n\n"
                    f"O {navio} apresenta sinais de deterioração moderada. "
                    f"Recomenda-se planejar limpeza nos próximos 60-90 dias.",
        
        'BAIXA': f"🟢 **MONITORAMENTO ATIVO**\n\n"
                 f"O {navio} apresenta deterioração leve. "
                 f"Recomenda-se monitorar e planejar limpeza preventiva nos próximos 90-120 dias.",
        
        'NÃO URGENTE': f"✅ **SITUAÇÃO ESTÁVEL**\n\n"
                       f"O {navio} não apresenta sinais críticos de deterioração. "
                       f"Manter monitoramento regular."
    }
    
    base = recomendacoes.get(urgencia, recomendacoes['NÃO URGENTE'])
    
    # Adiciona detalhes específicos
    detalhes = []
    
    if dias_sem_docagem:
        anos = dias_sem_docagem / 365
        detalhes.append(f"• Última docagem: {anos:.1f} anos atrás")
    
    if taxa_deterioracao > 0:
        detalhes.append(f"• Taxa de deterioração: {taxa_deterioracao:.6f} ton/nm/mês")
    
    if pd.notna(iws_score):
        detalhes.append(f"• Score de bioincrustação: {iws_score*100:.1f}%")
    
    if pd.notna(aumento_percentual) and aumento_percentual > 0:
        detalhes.append(f"• Aumento de consumo: +{aumento_percentual:.1f}%")
    
    if roi_data and roi_data.get('roi_percentual'):
        detalhes.append(f"• ROI estimado: {roi_data['roi_percentual']:.1f}%")
        if roi_data.get('payback_meses'):
            detalhes.append(f"• Payback: {roi_data['payback_meses']:.1f} meses")
    
    if detalhes:
        base += "\n\n**Indicadores:**\n" + "\n".join(detalhes)
    
    return base


# ============================================
# FUNÇÃO PRINCIPAL
# ============================================

def gerar_sugestoes_limpeza():
    """Gera sugestões de limpeza para todas as embarcações"""
    logger.info("🧹 GERANDO SUGESTÕES DE LIMPEZA")
    logger.info("=" * 60)
    
    # Carrega dados
    deterioracao, iws_resumo, iws_deterioracao, navios, docagens = load_data()
    
    # Data de referência (hoje)
    data_referencia = datetime.now()
    
    # Pega o período mais recente de cada navio
    deterioracao_recente = deterioracao.sort_values('periodo_fim').groupby('navio').last().reset_index()
    
    resultados = []
    
    for _, row in deterioracao_recente.iterrows():
        navio = row['navio']
        
        # Busca características do navio
        navio_info = navios[navios['nome_normalizado'] == navio]
        classe = navio_info['Classe'].iloc[0] if len(navio_info) > 0 else 'default'
        
        # Dados de deterioração
        taxa_deterioracao = row.get('taxa_deterioracao_mes', 0)
        aumento_percentual = row.get('aumento_percentual_periodo', 0)
        consumo_medio = row.get('consumo_medio', 0)
        r2 = row.get('r2', 0)
        
        # Dados IWS
        iws_info = iws_resumo[iws_resumo['navio'] == navio]
        iws_score = iws_info['score_medio'].iloc[0] if len(iws_info) > 0 else None
        iws_max = iws_info['score_max'].iloc[0] if len(iws_info) > 0 else None
        
        # Dias desde última docagem
        dias_sem_docagem, ultima_docagem = calcular_dias_desde_docagem(navio, docagens, data_referencia)
        
        # Custo de limpeza estimado
        custo_limpeza = CUSTOS['limpeza_por_navio'].get(classe, CUSTOS['limpeza_por_navio']['default'])
        
        # Custo de combustível extra
        custo_combustivel_extra, consumo_extra_mensal = calcular_custo_combustivel_extra(
            taxa_deterioracao, dias_sem_docagem, consumo_medio
        )
        
        # ROI
        roi_data = calcular_roi_limpeza(custo_limpeza, custo_combustivel_extra, consumo_extra_mensal)
        
        # Classifica urgência
        urgencia, score_urgencia, fatores = classificar_urgencia(
            taxa_deterioracao, iws_score, aumento_percentual, dias_sem_docagem
        )
        
        # Gera recomendação
        recomendacao = gerar_recomendacao(
            urgencia, navio, classe, dias_sem_docagem, taxa_deterioracao,
            iws_score, aumento_percentual, custo_limpeza, roi_data
        )
        
        # Prioridade numérica (para ordenação)
        prioridade_map = {
            'CRÍTICA': 1,
            'ALTA': 2,
            'MODERADA': 3,
            'BAIXA': 4,
            'NÃO URGENTE': 5
        }
        
        resultado = {
            'navio': navio,
            'classe': classe,
            'prioridade': prioridade_map.get(urgencia, 5),
            'urgencia': urgencia,
            'score_urgencia': round(score_urgencia, 2),
            'fatores_considerados': '; '.join(fatores),
            
            # Dados de deterioração
            'taxa_deterioracao_mes': round(taxa_deterioracao, 6),
            'aumento_percentual': round(aumento_percentual, 2),
            'consumo_medio_ton_nm': round(consumo_medio, 4),
            'r2': round(r2, 4),
            
            # Dados IWS
            'score_iws_medio': round(iws_score, 3) if pd.notna(iws_score) else None,
            'score_iws_max': round(iws_max, 3) if pd.notna(iws_max) else None,
            
            # Tempo
            'dias_sem_docagem': dias_sem_docagem,
            'ultima_docagem': ultima_docagem.strftime('%Y-%m-%d') if pd.notna(ultima_docagem) else None,
            'anos_sem_docagem': round(dias_sem_docagem / 365, 2) if dias_sem_docagem else None,
            
            # Custos e ROI
            'custo_limpeza_estimado': custo_limpeza,
            'custo_combustivel_extra_6meses': round(custo_combustivel_extra, 2),
            'consumo_extra_mensal_ton': round(consumo_extra_mensal, 2),
            'roi_percentual': roi_data['roi_percentual'] if roi_data else None,
            'economia_anual_estimada': roi_data['economia_anual_estimada'] if roi_data else None,
            'payback_meses': roi_data['payback_meses'] if roi_data and roi_data.get('payback_meses') else None,
            
            # Recomendação
            'recomendacao': recomendacao,
            'prazo_sugerido_dias': {
                'CRÍTICA': 15,
                'ALTA': 45,
                'MODERADA': 75,
                'BAIXA': 105,
                'NÃO URGENTE': None
            }.get(urgencia)
        }
        
        resultados.append(resultado)
    
    # Cria DataFrame
    df_resultados = pd.DataFrame(resultados)
    
    # Ordena por prioridade
    df_resultados = df_resultados.sort_values('prioridade').reset_index(drop=True)
    
    # Salva resultados
    RESULTS_DIR.mkdir(exist_ok=True)
    df_resultados.to_csv(RESULTS_DIR / "sugestoes_limpeza.csv", index=False)
    logger.success(f"💾 Salvo: sugestoes_limpeza.csv")
    
    # Gera resumo
    logger.info("\n" + "=" * 60)
    logger.info("📊 RESUMO DAS SUGESTÕES")
    logger.info("=" * 60)
    
    for urg in ['CRÍTICA', 'ALTA', 'MODERADA', 'BAIXA', 'NÃO URGENTE']:
        count = len(df_resultados[df_resultados['urgencia'] == urg])
        if count > 0:
            logger.info(f"{urg}: {count} navio(s)")
    
    # Top 5 mais urgentes
    logger.info("\n🔴 Top 5 navios com maior urgência:")
    top5 = df_resultados.head(5)
    for _, row in top5.iterrows():
        logger.info(f"  {row['navio']} ({row['classe']}): {row['urgencia']} - Score: {row['score_urgencia']}")
        if row.get('prazo_sugerido_dias'):
            logger.info(f"    → Prazo sugerido: {row['prazo_sugerido_dias']} dias")
    
    logger.info("\n✅ ANÁLISE CONCLUÍDA!")
    logger.info(f"📁 Resultados salvos em: {RESULTS_DIR / 'sugestoes_limpeza.csv'}")
    
    return df_resultados


if __name__ == "__main__":
    gerar_sugestoes_limpeza()

