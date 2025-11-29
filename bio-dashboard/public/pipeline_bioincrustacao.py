from pathlib import Path
import glob
import json
import unicodedata
from statsmodels.tsa.statespace.sarimax import SARIMAX
import numpy as np


import pandas as pd


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "data_dash"
OUT_DIR.mkdir(exist_ok=True)


def normalize_name(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = s.upper()
    s = "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )
    return s.strip()


def carregar_dados():
    iws = pd.read_excel(DATA_DIR / "Relatorios IWS.xlsx")
    navios = pd.read_excel(DATA_DIR / "Dados navios Hackathon.xlsx")
    eventos = pd.read_csv(DATA_DIR / "ResultadoQueryEventos.csv")
    consumo = pd.read_csv(DATA_DIR / "ResultadoQueryConsumo.csv")

    return iws, navios, eventos, consumo


def carregar_trilhas_ais():
    trilhas = []
    padrao = str(DATA_DIR / "*.csv")

    for caminho in glob.glob(padrao):
        nome_arquivo = Path(caminho).name

        if "ResultadoQueryConsumo" in nome_arquivo or "ResultadoQueryEventos" in nome_arquivo:
            continue

        df = pd.read_csv(caminho)

        colunas_esperadas = {
            "NOME",
            "DATAHORA",
            "RUMO",
            "VELOCIDADE",
            "LATITUDE",
            "LONGITUDE",
        }
        if not colunas_esperadas.issubset(df.columns):
            continue

        df["NOME_NORMALIZADO"] = df["NOME"].apply(normalize_name)
        df["DATAHORA"] = pd.to_datetime(df["DATAHORA"], errors="coerce")
        trilhas.append(df)

    if trilhas:
        return pd.concat(trilhas, ignore_index=True)
    return pd.DataFrame(
        columns=[
            "NOME",
            "DATAHORA",
            "RUMO",
            "VELOCIDADE",
            "LATITUDE",
            "LONGITUDE",
            "NOME_NORMALIZADO",
        ]
    )


def limpar_iws(iws: pd.DataFrame) -> pd.DataFrame:
    def parse_data(val):
        try:
            return pd.to_datetime(val)
        except Exception:
            return pd.NaT

    iws = iws.copy()
    iws["DataParsed"] = iws["Data"].apply(parse_data)
    iws["NOME_NORMALIZADO"] = iws["Embarcação"].apply(normalize_name)
    return iws


def calcular_intervalos_iws(iws: pd.DataFrame) -> pd.DataFrame:
    df = iws[iws["DataParsed"].notna()].copy()
    df = df.sort_values("DataParsed")

    registros = []
    for embarcacao, grp in df.groupby("Embarcação"):
        datas = grp["DataParsed"].sort_values().tolist()
        if len(datas) < 2:
            continue

        diffs = [(datas[i] - datas[i - 1]).days for i in range(1, len(datas))]
        registros.append(
            {
                "Embarcação": embarcacao,
                "Classe": grp["Classe"].iloc[0],
                "NOME_NORMALIZADO": normalize_name(embarcacao),
                "qtd_intervalos": len(diffs),
                "media_dias_entre_iws": sum(diffs) / len(diffs),
                "mediana_dias_entre_iws": float(pd.Series(diffs).median()),
                "min_dias_entre_iws": int(min(diffs)),
                "max_dias_entre_iws": int(max(diffs)),
            }
        )

    return pd.DataFrame(registros)


def resumo_intervalos_por_classe(intervalos: pd.DataFrame) -> pd.DataFrame:
    if intervalos.empty:
        return pd.DataFrame()

    resumo = (
        intervalos.groupby("Classe")["mediana_dias_entre_iws"]
        .agg(["count", "mean", "min", "max"])
        .reset_index()
    )

    resumo = resumo.rename(
        columns={
            "Classe": "classe",
            "count": "qtd_navios_com_historico",
            "mean": "media_mediana_dias_entre_iws",
            "min": "min_mediana_dias_entre_iws",
            "max": "max_mediana_dias_entre_iws",
        }
    )
    return resumo


def mapa_tipos_incrustacao(iws: pd.DataFrame) -> dict:
    def contar(col):
        if col not in iws.columns:
            return []
        return (
            iws[col]
            .value_counts(dropna=True)
            .reset_index()
            .rename(columns={"index": "tipo", col: "quantidade"})
            .to_dict(orient="records")
        )

    return {
        "embarcacao": contar("Tipo de incrustação da embarcação"),
        "fundo_chato": contar("Tipo de incrustação do fundo chato"),
        "costado": contar("Tipo de incrustação do costado"),
        "helice": contar("Tipo de incrustação do hélice"),
    }


def gerar_kpis(iws: pd.DataFrame, navios: pd.DataFrame) -> dict:
    kpi = {}

    kpi["total_navios"] = int(navios["Nome do navio"].nunique())
    kpi["navios_por_classe"] = (
        navios["Classe"]
        .value_counts()
        .reset_index()
        .rename(columns={"index": "classe", "Classe": "quantidade"})
        .to_dict(orient="records")
    )

    kpi["total_inspecoes_iws"] = int(iws.shape[0])

    if "Tipo de incrustação da embarcação" in iws.columns:
        # Tipo de incrustação mais comum
        col_incr = "Tipo de incrustação da embarcação"

        if col_incr in iws.columns:
            tipos_emb = iws[col_incr].value_counts(dropna=True)
            if not tipos_emb.empty:
                kpi["tipo_incrustacao_mais_comum"] = tipos_emb.index[0]
            else:
                kpi["tipo_incrustacao_mais_comum"] = None
        else:
            kpi["tipo_incrustacao_mais_comum"] = None

    else:
        kpi["tipo_incrustacao_mais_comum"] = None

    return kpi


def resumo_trilhas_ais(ais_df: pd.DataFrame) -> pd.DataFrame:
    if ais_df.empty:
        return pd.DataFrame(
            columns=[
                "NOME_NORMALIZADO",
                "primeiro_ponto",
                "ultimo_ponto",
                "pontos_total",
                "velocidade_media",
                "velocidade_max",
            ]
        )

    resumo = (
        ais_df.groupby("NOME_NORMALIZADO")
        .agg(
            primeiro_ponto=("DATAHORA", "min"),
            ultimo_ponto=("DATAHORA", "max"),
            pontos_total=("DATAHORA", "count"),
            velocidade_media=("VELOCIDADE", "mean"),
            velocidade_max=("VELOCIDADE", "max"),
        )
        .reset_index()
    )

    return resumo

def preparar_trilhas_para_mapa(ais_df, navios):
    """
    Gera uma tabela reduzida para o mapa:
    - uma linha por ponto AIS
    - já com nome do navio, classe e data em string
    """

    if ais_df.empty:
        return pd.DataFrame(
            columns=[
                "nome_navio",
                "classe",
                "datahora",
                "lat",
                "lng",
            ]
        )

    navios_norm = navios.copy()
    navios_norm["NOME_NORMALIZADO"] = navios_norm["Nome do navio"].apply(
        normalize_name
    )
    navios_norm = navios_norm[["NOME_NORMALIZADO", "Classe"]]

    df = ais_df.copy()
    df["datahora"] = df["DATAHORA"].dt.strftime("%Y-%m-%d %H:%M:%S")
    df = df.rename(columns={"LATITUDE": "lat", "LONGITUDE": "lng"})

    # junta classe pelo nome normalizado
    df = df.merge(
        navios_norm,
        on="NOME_NORMALIZADO",
        how="left",
    )

    df_out = df[
        [
            "NOME",
            "Classe",
            "datahora",
            "lat",
            "lng",
        ]
    ].rename(
        columns={
            "NOME": "nome_navio",
            "Classe": "classe",
        }
    )

    # opcional. reduzir pontos (ex. pegar 1 a cada 5)
    # df_out = df_out.iloc[::5, :]

    return df_out



def resumo_eventos_consumo(eventos: pd.DataFrame, consumo: pd.DataFrame) -> pd.DataFrame:
    eventos = eventos.copy()
    eventos["NOME_NORMALIZADO"] = eventos["shipName"].apply(normalize_name)
    eventos["startGMTDate"] = pd.to_datetime(eventos["startGMTDate"], errors="coerce")
    eventos["endGMTDate"] = pd.to_datetime(eventos["endGMTDate"], errors="coerce")

    consumo = consumo.rename(columns={"SESSION_ID": "sessionId"})
    consumo_por_sessao = (
        consumo.groupby("sessionId")["CONSUMED_QUANTITY"].sum().reset_index()
    )

    eventos = eventos.merge(consumo_por_sessao, on="sessionId", how="left")

    resumo = (
        eventos.groupby("NOME_NORMALIZADO")
        .agg(
            sessoes=("sessionId", "nunique"),
            duracao_total_h=("duration", "sum"),
            distancia_total_nm=("distance", "sum"),
            combustivel_total=("CONSUMED_QUANTITY", "sum"),
        )
        .reset_index()
    )

    return resumo


def resumo_navios(
    navios: pd.DataFrame,
    iws_summary: pd.DataFrame,
    intervalos: pd.DataFrame,
    ais_summary: pd.DataFrame,
    eventos_summary: pd.DataFrame,
) -> pd.DataFrame:
    navios = navios.copy()
    navios["NOME_NORMALIZADO"] = navios["Nome do navio"].apply(normalize_name)

    iws_summary = iws_summary.copy()
    iws_summary["NOME_NORMALIZADO"] = iws_summary["NOME_NORMALIZADO"].apply(
        normalize_name
    )

    intervalos = intervalos.copy()

    df = navios[
        ["NOME_NORMALIZADO", "Nome do navio", "Classe", "Tipo", "Porte Bruto"]
    ].merge(
        iws_summary[
            ["NOME_NORMALIZADO", "classe_iws", "qtd_iws", "ultima_iws"]
        ],
        on="NOME_NORMALIZADO",
        how="left",
    )

    df = df.merge(
        intervalos[
            [
                "NOME_NORMALIZADO",
                "media_dias_entre_iws",
                "mediana_dias_entre_iws",
                "min_dias_entre_iws",
                "max_dias_entre_iws",
                "qtd_intervalos",
            ]
        ],
        on="NOME_NORMALIZADO",
        how="left",
    )

    df = df.merge(ais_summary, on="NOME_NORMALIZADO", how="left")
    df = df.merge(eventos_summary, on="NOME_NORMALIZADO", how="left")

    for col in ["ultima_iws", "primeiro_ponto", "ultimo_ponto"]:
        if col in df.columns:
            df[col] = df[col].astype("datetime64[ns]")
            df[col] = df[col].dt.strftime("%Y-%m-%d")

    return df


def salvar_json_df(df: pd.DataFrame, nome_arquivo: str):
    caminho = OUT_DIR / nome_arquivo
    df.to_json(caminho, orient="records", force_ascii=False, indent=2)
    
def prever_proxima_iws_por_navio(iws: pd.DataFrame) -> pd.DataFrame:
    """
    Retorna um DF com:
    - Embarcação
    - ultima_iws
    - dias_previstos_ate_proxima_iws
    - data_prevista_proxima_iws

    Usa SARIMA em cima dos intervalos históricos.
    Se não houver dados suficientes, deixa previsões em NaN.
    """
    resultados = []

    df = iws[iws["DataParsed"].notna()].copy()
    df = df.sort_values("DataParsed")

    for embarcacao, grp in df.groupby("Embarcação"):
        datas = grp["DataParsed"].sort_values().tolist()
        if len(datas) < 3:
            # menos de 3 datas = previsão fraca. não faz
            resultados.append(
                {
                    "Embarcação": embarcacao,
                    "ultima_iws": datas[-1] if datas else pd.NaT,
                    "dias_previstos_ate_proxima_iws": np.nan,
                    "data_prevista_proxima_iws": pd.NaT,
                }
            )
            continue

        # série de intervalos
        intervalos = pd.Series(
            [(datas[i] - datas[i - 1]).days for i in range(1, len(datas))],
            dtype="float",
        )

        try:
            # modelo simples SARIMA(1,0,0) com sazonalidade desativada
            # (se tiver muita sazonalidade, aqui daria pra ajustar depois)
            model = SARIMAX(
                intervalos,
                order=(1, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            fit = model.fit(disp=False)
            forecast = fit.forecast(steps=1)
            dias_previstos = max(float(forecast.iloc[0]), 1.0)  # não deixar <= 0
            data_prevista = datas[-1] + pd.Timedelta(days=dias_previstos)
        except Exception as e:
            print(f"Falha previsão SARIMA para {embarcacao}: {e}")
            dias_previstos = np.nan
            data_prevista = pd.NaT

        resultados.append(
            {
                "Embarcação": embarcacao,
                "ultima_iws": datas[-1],
                "dias_previstos_ate_proxima_iws": dias_previstos,
                "data_prevista_proxima_iws": data_prevista,
            }
        )

    df_res = pd.DataFrame(resultados)

    # formata datas como string para JSON
    for col in ["ultima_iws", "data_prevista_proxima_iws"]:
        df_res[col] = df_res[col].astype("datetime64[ns]")
        df_res[col] = df_res[col].dt.strftime("%Y-%m-%d")

    return df_res


def main():
    iws, navios, eventos, consumo = carregar_dados()
    trilhas = carregar_trilhas_ais()
    trilhas_mapa_df = preparar_trilhas_para_mapa(trilhas, navios)

    iws = limpar_iws(iws)

    intervalos_navio = calcular_intervalos_iws(iws)
    previsao_iws_df = prever_proxima_iws_por_navio(iws)
    salvar_json_df(previsao_iws_df, "previsao_iws_navio.json")
    intervalos_classe = resumo_intervalos_por_classe(intervalos_navio)
    tipos_incrustacao = mapa_tipos_incrustacao(iws)
    kpis = gerar_kpis(iws, navios)

    iws_summary = (
        iws.groupby("NOME_NORMALIZADO")
        .agg(
            classe_iws=("Classe", "first"),
            qtd_iws=("DataParsed", "count"),
            ultima_iws=("DataParsed", "max"),
        )
        .reset_index()
    )

    ais_summary = resumo_trilhas_ais(trilhas)
    eventos_summary = resumo_eventos_consumo(eventos, consumo)

    navios_resumo_df = resumo_navios(
        navios, iws_summary, intervalos_navio, ais_summary, eventos_summary
    )

    salvar_json_df(intervalos_navio, "iws_intervalos_navio.json")
    salvar_json_df(intervalos_classe, "iws_intervalos_classe.json")
    salvar_json_df(navios_resumo_df, "navios_resumo.json")
    salvar_json_df(trilhas_mapa_df, "ais_trilhas.json")
    

    (OUT_DIR / "iws_tipos_incrustacao.json").write_text(
        json.dumps(tipos_incrustacao, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (OUT_DIR / "kpis.json").write_text(
        json.dumps(kpis, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("Arquivos gerados em", OUT_DIR)


if __name__ == "__main__":
    main()
