from pathlib import Path
import glob
import json
import unicodedata
from statsmodels.tsa.statespace.sarimax import SARIMAX
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon
from rtree import index as rtree_index


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "data_dash"
OUT_DIR.mkdir(exist_ok=True)

def validar_config_regioes(regioes_cfg):
    if not isinstance(regioes_cfg, list):
        raise ValueError("config_regioes.json deve conter uma LISTA no topo.")

    for idx, reg in enumerate(regioes_cfg):
        if not isinstance(reg, dict):
            raise ValueError(f"Item #{idx} no JSON não é um objeto válido.")

        # valida nome
        if "nome" not in reg:
            raise KeyError(f"Item #{idx} está sem a chave obrigatória 'nome'.")

        # valida tipo_agua
        if "tipo_agua" not in reg:
            raise KeyError(f"'{reg.get('nome','?')}' está sem a chave 'tipo_agua'.")

        # valida lista de poligonos
        if "poligonos" not in reg or not isinstance(reg["poligonos"], list):
            raise ValueError(
                f"'{reg['nome']}' possui 'poligonos' ausente ou inválido."
            )

        # valida cada polígono
        for p_idx, pol in enumerate(reg["poligonos"]):

            if "nome" not in pol:
                raise KeyError(
                    f"Polígono #{p_idx} da região '{reg['nome']}' está sem 'nome'."
                )

            if "pontos" not in pol:
                raise KeyError(
                    f"Polígono '{pol.get('nome','?')}' em '{reg['nome']}' está sem 'pontos'."
                )

            # valida coordenadas
            pontos = pol["pontos"]
            if not isinstance(pontos, list) or len(pontos) < 3:
                raise ValueError(
                    f"Polígono '{pol['nome']}' em '{reg['nome']}' precisa ter pelo menos 3 coordenadas."
                )

            # verifica se cada ponto é [lat, lon]
            for pt in pontos:
                if (
                    not isinstance(pt, list)
                    or len(pt) != 2
                    or not all(isinstance(v, (float, int)) for v in pt)
                ):
                    raise ValueError(
                        f"Ponto inválido no polígono '{pol['nome']}' da região '{reg['nome']}': {pt}"
                    )

    print("config_regioes.json validado com sucesso!")


def normalize_name(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = s.upper()
    s = "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )
    return s.strip()

def normalize_incrustacao_label(s: str):
    """Normaliza rótulos de bioincrustação para reduzir variações de texto.

    Exemplos que passam a ser considerados iguais:
    - "Craca e mole"  -> "Craca Mole"
    - "mole / craca"  -> "Craca Mole"
    - diferenças de acento e caixa também são removidas.
    """
    if not isinstance(s, str):
        return None

    # remove acentos e coloca em minúsculas
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().strip()

    if not s:
        return None

    # substitui separadores por espaço
    for sep in ["/", "+", "-", ","]:
        s = s.replace(sep, " ")
    s = s.replace(" e ", " ")

    # quebra em tokens, ordena e remonta
    tokens = [t for t in s.split() if t]
    if not tokens:
        return None

    tokens = sorted(tokens)
    # devolve em formato amigável
    return " ".join(t.capitalize() for t in tokens)


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

# ================================
# NORMALIZAÇÃO INTELIGENTE DE INCRUSTAÇÃO
# ================================

def normalizar_incrustacao(txt: str) -> str:
    if not isinstance(txt, str):
        return "DESCONHECIDO"

    t = txt.strip().lower()

    substituicoes = {
        "craca": ["craca", "craca leve", "craca fina", "cracas"],
        "mole": ["mole", "organismo mole", "moleza"],
        "algas": ["alga", "algas", "algas diversas"],
        "mexilhao": ["mexilhão", "mexilhao", "meixilhao"],
    }

    # combinações tipo “craca e mole”
    combinacoes = [
        ("craca", "mole", ["craca e mole", "mole e craca", "craca + mole", "craca/mole"])
    ]

    for final, palavras in substituicoes.items():
        for p in palavras:
            if t == p:
                return final.upper()

    for a, b, lista in combinacoes:
        for p in lista:
            if t == p:
                return f"{a.upper()} + {b.upper()}"

    return txt.upper()

def mapa_tipos_incrustacao(iws: pd.DataFrame) -> dict:
    """Gera contagem de tipos de bioincrustação já normalizados.

    O objetivo é reduzir ruído de rótulos duplicados, como
    "Craca e mole" x "Mole e craca", que passam a ser agregados
    sob o mesmo nome canônico.
    """

    def contar_normalizado(col: str):
        if col not in iws.columns:
            return []

        serie = iws[col].dropna().astype(str)
        if serie.empty:
            return []

        serie_norm = serie.map(normalize_incrustacao_label)
        serie_norm = serie_norm.dropna()
        if serie_norm.empty:
            return []

        vc = serie_norm.value_counts()
        df = vc.reset_index()
        df.columns = ["tipo", "quantidade"]
        return df.to_dict(orient="records")

    return {
        "embarcacao": contar_normalizado("Tipo de incrustação da embarcação"),
        "fundo_chato": contar_normalizado("Tipo de incrustação do fundo chato"),
        "costado": contar_normalizado("Tipo de incrustação do costado"),
        "helice": contar_normalizado("Tipo de incrustação do hélice"),
    }

def ranking_global_incrustacao(iws: pd.DataFrame) -> pd.DataFrame:
    """Ranking único de tipos de bioincrustação em todas as posições do casco.

    Usa os mesmos rótulos normalizados de `mapa_tipos_incrustacao`
    e consolida embarcação, fundo chato, costado e hélice em uma lista só.
    """
    colunas = [
        "Tipo de incrustação da embarcação",
        "Tipo de incrustação do fundo chato",
        "Tipo de incrustação do costado",
        "Tipo de incrustação do hélice",
    ]

    series_coletadas = []

    for col in colunas:
        if col not in iws.columns:
            continue

        s = iws[col].dropna().astype(str)
        if s.empty:
            continue

        s_norm = s.map(normalize_incrustacao_label).dropna()
        if not s_norm.empty:
            series_coletadas.append(s_norm)

    if not series_coletadas:
        return pd.DataFrame(columns=["tipo", "quantidade"])

    serie_total = pd.concat(series_coletadas, ignore_index=True)
    vc = serie_total.value_counts()
    df = vc.reset_index()
    df.columns = ["tipo", "quantidade"]
    return df


    def contar(col):
        if col not in iws.columns:
            return []

        temp = iws[col].dropna().apply(normalizar_incrustacao)

        return (
            temp.value_counts(dropna=True)
            .reset_index()
            .rename(columns={"index": "tipo", col: "quantidade"})
            .to_dict(orient="records")
        )
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

def calcular_desvio_consumo(navios, eventos_summary):
    df = eventos_summary.copy()

    # Criar NOME_NORMALIZADO baseado na coluna real
    navios = navios.copy()
    navios["NOME_NORMALIZADO"] = (
        navios["Nome do navio"]
        .str.upper()
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("ascii")
        .str.strip()
    )

    # Garantir que eventos_summary também está normalizado
    df["NOME_NORMALIZADO"] = (
        df["NOME_NORMALIZADO"]
        .str.upper()
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("ascii")
        .str.strip()
    )

    # Preparar merge seguro
    navinfo = navios[["NOME_NORMALIZADO", "Classe", "Porte Bruto"]].copy()

    df = df.merge(navinfo, on="NOME_NORMALIZADO", how="left")

    # Calcular consumo esperado
    df["consumo_esperado"] = (
        0.035 * df["Porte Bruto"] +
        0.22 * df["distancia_total_nm"] +
        1.8
    )

    df["desvio_consumo"] = df["combustivel_total"] - df["consumo_esperado"]

    return df[
        [
            "NOME_NORMALIZADO",
            "Classe",
            "Porte Bruto",
            "distancia_total_nm",
            "combustivel_total",
            "consumo_esperado",
            "desvio_consumo",
        ]
    ]


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
    resultados = []
    df = iws[iws["DataParsed"].notna()].copy()
    df = df.sort_values("DataParsed")

    for embarcacao, grp in df.groupby("Embarcação"):
        datas = grp["DataParsed"].sort_values().tolist()

        # caso tenha poucos pontos
        if len(datas) < 3:
            resultados.append({
                "Embarcação": embarcacao,
                "ultima_iws": datas[-1] if datas else pd.NaT,
                "dias_previstos_ate_proxima_iws": np.nan,
                "data_prevista_proxima_iws": pd.NaT,
            })
            continue

        # obter intervalos
        intervalos = pd.Series(
            [(datas[i] - datas[i - 1]).days for i in range(1, len(datas))],
            dtype=float
        )

        # FORECAST SIMPLES = média dos intervalos
        previsao = float(intervalos.mean())
        data_prevista = datas[-1] + pd.Timedelta(days=previsao)

        resultados.append({
            "Embarcação": embarcacao,
            "ultima_iws": datas[-1],
            "dias_previstos_ate_proxima_iws": previsao,
            "data_prevista_proxima_iws": data_prevista,
        })

    df_res = pd.DataFrame(resultados)
    df_res["ultima_iws"] = pd.to_datetime(df_res["ultima_iws"]).dt.strftime("%Y-%m-%d")
    df_res["data_prevista_proxima_iws"] = pd.to_datetime(
        df_res["data_prevista_proxima_iws"]
    ).dt.strftime("%Y-%m-%d")

    return df_res


#  NOVO MÓDULO: CLASSIFICAÇÃO DE REGIÃO E TIPO DE ÁGUA

from shapely.geometry import Point, Polygon

CONFIG_DIR = BASE_DIR / "data"
REGIOES_FILE = CONFIG_DIR / "config_regioes.json"


def carregar_regioes():
    caminho = DATA_DIR / "config_regioes.json"

    if not caminho.exists():
        caminho_alt = DATA_DIR / "config_regioes.json"
        if caminho_alt.exists():
            caminho = caminho_alt
        else:
            raise FileNotFoundError(
                f"Arquivo {caminho} NÃO encontrado. Verifique o nome e localização."
            )

    with open(caminho, "r", encoding="utf-8") as f:
        bruto = json.load(f)

    # valida estrutura do JSON (opcional mas ajuda)
    validar_config_regioes(bruto)

    regioes_out = []

    for reg in bruto:
        nome = reg.get("nome")
        agua = reg.get("tipo_agua", "desconhecido")
        lista_poligonos = reg.get("poligonos", [])

        if not nome or not lista_poligonos:
            print(f"Região ignorada (sem nome ou sem polígonos): {reg}")
            continue

        for poly_info in lista_poligonos:
            nome_poly = poly_info.get("nome", "poligono_sem_nome")
            pontos = poly_info.get("pontos")

            if not pontos or len(pontos) < 3:
                print(f"Polígono inválido em {nome}: {poly_info}")
                continue

            try:
                # pontos no JSON estão como [LAT, LON]
                # shapely espera (x, y) = (LON, LAT)
                pontos_xy = [(lon, lat) for lat, lon in pontos]
                polygon = Polygon(pontos_xy)
            except Exception as e:
                print(f"Erro ao criar polígono {nome_poly}: {e}")
                continue

            regioes_out.append(
                {
                    "nome_regiao": nome,
                    "tipo_agua": agua,
                    "nome_poligono": nome_poly,
                    "polygon": polygon,
                }
            )

    print(f"{len(regioes_out)} polígonos carregados e validados!")
    return regioes_out

    caminho = DATA_DIR / "config_regioes.json"

    if not caminho.exists():
        caminho_alt = DATA_DIR / "config_regioes.json"
        if caminho_alt.exists():
            caminho = caminho_alt
        else:
            raise FileNotFoundError(
                f"Arquivo {caminho} NÃO encontrado. Verifique o nome e localização."
            )

    with open(caminho, "r", encoding="utf-8") as f:
        bruto = json.load(f)

    regioes_out = []

    for reg in bruto:

        nome = reg.get("nome")
        agua = reg.get("tipo_agua", "desconhecido")
        lista_poligonos = reg.get("poligonos", [])

        if not nome or not lista_poligonos:
            print(f"Região ignorada (sem nome ou sem polígonos): {reg}")
            continue

        for poly_info in lista_poligonos:

            nome_poly = poly_info.get("nome", "poligono_sem_nome")
            pontos = poly_info.get("pontos")

            if not pontos or len(pontos) < 3:
                print(f"Polígono inválido em {nome}: {poly_info}")
                continue

            try:
                polygon = Polygon(pontos)
            except Exception as e:
                print(f"Erro ao criar polígono {nome_poly}: {e}")
                continue

            regioes_out.append(
                {
                    "nome_regiao": nome,
                    "tipo_agua": agua,
                    "nome_poligono": nome_poly,
                    "polygon": polygon,
                }
            )

    print(f"✔ {len(regioes_out)} polígonos carregados e validados!")
    return regioes_out

def classificar_ponto(lat, lon, regioes_cfg):
    if not regioes_cfg:
        return "Desconhecido", "Desconhecido"

    p = Point(lon, lat)
    for reg in regioes_cfg:
        if reg["polygon"].contains(p):
            return reg["nome_regiao"], reg["tipo_agua"]

    return "Desconhecido", "Desconhecido"


def calcular_tempo_regiao_agua(trilhas: pd.DataFrame, regioes_cfg):
    """
    Cálculo otimizado usando GeoPandas + sjoin.
    Milhões de vezes mais rápido que iterrows.
    """

    if trilhas.empty:
        return pd.DataFrame(columns=["navio", "regiao", "tipo_agua", "tempo_horas"])

    # -----------------------------------------
    # 1. Converter trilhas em GeoDataFrame
    # -----------------------------------------
    gdf = gpd.GeoDataFrame(
        trilhas.copy(),
        geometry=gpd.points_from_xy(trilhas["LONGITUDE"], trilhas["LATITUDE"]),
        crs="EPSG:4326"
    )

    # garantir ordenação
    gdf = gdf.sort_values(["NOME_NORMALIZADO", "DATAHORA"])

    # calcular tempo entre pontos por navio
    gdf["tempo"] = gdf.groupby("NOME_NORMALIZADO")["DATAHORA"].diff()
    gdf["tempo_horas"] = gdf["tempo"].dt.total_seconds() / 3600

    # -----------------------------------------
    # 2. Criar GeoDataFrame dos polígonos
    # -----------------------------------------
    rows = []
    for reg in regioes_cfg:
        rows.append({
            "regiao": reg["nome_regiao"],
            "tipo_agua": reg["tipo_agua"],
            "geometry": reg["polygon"]
        })

    gdf_regioes = gpd.GeoDataFrame(rows, crs="EPSG:4326")

    # -----------------------------------------
    # 3. Spatial join (ultra rápido)
    # -----------------------------------------
    gdf_join = gpd.sjoin(gdf, gdf_regioes, how="left", predicate="within")

    # pontos fora de todas as regiões
    gdf_join["regiao"] = gdf_join["regiao"].fillna("Fora")
    gdf_join["tipo_agua"] = gdf_join["tipo_agua"].fillna("desconhecido")

    # -----------------------------------------
    # 4. Agregar tempo por navio e região
    # -----------------------------------------
    df_out = (
        gdf_join.groupby(["NOME_NORMALIZADO", "regiao", "tipo_agua"])["tempo_horas"]
        .sum()
        .reset_index()
        .rename(columns={"NOME_NORMALIZADO": "navio"})
    )

    return df_out
def construir_serie_diaria_tempo(ais_df, regioes_cfg):
    df = ais_df.sort_values(["NOME_NORMALIZADO", "DATAHORA"]).copy()
    df["DATAHORA_PROX"] = df.groupby("NOME_NORMALIZADO")["DATAHORA"].shift(-1)
    df["delta_h"] = (df["DATAHORA_PROX"] - df["DATAHORA"]).dt.total_seconds() / 3600

    df = df[df["delta_h"].notna() & (df["delta_h"] > 0) & (df["delta_h"] <= 48)]

    regioes = []
    tipos_agua = []
    dias = []

    for _, row in df.iterrows():
        regiao, agua = classificar_ponto(row["LATITUDE"], row["LONGITUDE"], regioes_cfg)
        regioes.append(regiao)
        tipos_agua.append(agua)
        dias.append(row["DATAHORA"].date())

    df["regiao"] = regioes
    df["tipo_agua"] = tipos_agua
    df["dia"] = dias

    serie = (
        df.groupby(["NOME_NORMALIZADO", "regiao", "tipo_agua", "dia"])["delta_h"]
        .sum()
        .reset_index()
        .rename(columns={"delta_h": "horas_dia"})
    )

    return serie


# ===============================================
#  PREVISÃO SARIMA DO TEMPO EM REGIÃO
# ===============================================

def prever_tempo_regiao_sarima(serie_diaria, dias_previsao=30):
    resultados = []

    for (navio, regiao, agua), grp in serie_diaria.groupby(
        ["NOME_NORMALIZADO", "regiao", "tipo_agua"]
    ):
        grp = grp.sort_values("dia")

        if len(grp) < 10:
            continue  # série curta

        y = grp["horas_dia"].astype(float)
        idx = grp["dia"]

        try:
            # cria índice regular diário
            y_idx = pd.Series(
                y.values,
                index=pd.date_range(start=idx.min(), periods=len(y), freq="D")
            )

            # modelo limpo
            model = SARIMAX(
                y_idx,
                order=(1, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False
            )

            fit = model.fit(disp=False)
            forecast = fit.forecast(steps=dias_previsao)

            datas_prev = pd.date_range(
                y_idx.index[-1] + pd.Timedelta(days=1),
                periods=dias_previsao
            )

            for dt, valor in zip(datas_prev, forecast):
                resultados.append(
                    {
                        "NOME_NORMALIZADO": navio,
                        "regiao": regiao,
                        "tipo_agua": agua,
                        "data": dt.strftime("%Y-%m-%d"),
                        "horas_previstas": float(max(valor, 0)),
                    }
                )

        except Exception as e:
            print(f"Erro SARIMA ({navio}, {regiao}, {agua}):", e)

    return pd.DataFrame(resultados)


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
    ranking_incrustacao = ranking_global_incrustacao(iws)
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
    
    eventos_summary = resumo_eventos_consumo(eventos, consumo)

    desvio_consumo_df = calcular_desvio_consumo(navios, eventos_summary)

    salvar_json_df(desvio_consumo_df, "desvio_consumo_navio.json")
    salvar_json_df(intervalos_navio, "iws_intervalos_navio.json")
    salvar_json_df(intervalos_classe, "iws_intervalos_classe.json")
    salvar_json_df(navios_resumo_df, "navios_resumo.json")
    salvar_json_df(trilhas_mapa_df, "ais_trilhas.json")
    

    (OUT_DIR / "iws_tipos_incrustacao.json").write_text(
        json.dumps(tipos_incrustacao, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # ranking global para os insights
    salvar_json_df(ranking_incrustacao, "iws_incrustacao_ranking.json")

    (OUT_DIR / "kpis.json").write_text(
        json.dumps(kpis, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    
        # ===============================================
    #   NOVO PROCESSO: TEMPO POR REGIÃO / ÁGUA + SARIMA
    # ===============================================

    regioes_cfg = carregar_regioes()

    tempo_regiao_df = calcular_tempo_regiao_agua(trilhas, regioes_cfg)
    salvar_json_df(tempo_regiao_df, "tempo_regiao_agua_navio.json")

    serie_diaria = construir_serie_diaria_tempo(trilhas, regioes_cfg)
    salvar_json_df(serie_diaria, "serie_tempo_regiao_navio.json")

    previsao_tempo = prever_tempo_regiao_sarima(serie_diaria, dias_previsao=30)
    salvar_json_df(previsao_tempo, "previsao_tempo_regiao_navio.json")

    tempo_por_navio = (
        tempo_regiao_df
        .groupby(["navio", "tipo_agua"])["tempo_horas"]
        .sum()
        .reset_index()
    )

    salvar_json_df(tempo_por_navio, "tempo_navio_agua.json")

    
    print("Arquivos gerados em", OUT_DIR)


if __name__ == "__main__":
    main()
