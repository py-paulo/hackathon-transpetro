#!/usr/bin/env python3
"""
Script para importar dados de CSV para MongoDB

Uso:
    python csv_to_mongodb.py <arquivo.csv> <collection_name> [--db <database>] [--uri <mongodb_uri>]

Exemplos:
    python csv_to_mongodb.py ../data/navios.csv navios
    python csv_to_mongodb.py ../data/consumo.csv consumo --db hackathon
    python csv_to_mongodb.py dados.csv collection --uri mongodb://user:pass@host:27017
"""

import pandas as pd
import argparse
import re
from pathlib import Path
from datetime import datetime
from loguru import logger
import sys

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, BulkWriteError
except ImportError:
    logger.error("❌ PyMongo não instalado. Execute: pip install pymongo")
    sys.exit(1)


# Configurações padrão
DEFAULT_MONGODB_URI = "mongodb://admin:your_admin_password@localhost:27017"
DEFAULT_DATABASE = "hackathon"


def connect_mongodb(uri: str, database: str):
    """
    Conecta ao MongoDB e retorna o cliente e database
    """
    logger.info(f"🔗 Conectando ao MongoDB: {uri}")
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Testa a conexão
        client.admin.command('ping')
        logger.success("✅ Conectado ao MongoDB!")
        
        db = client[database]
        logger.info(f"📂 Database: {database}")
        
        return client, db
    
    except ConnectionFailure as e:
        logger.error(f"❌ Falha ao conectar ao MongoDB: {e}")
        sys.exit(1)


def load_csv(filepath: str) -> pd.DataFrame:
    """
    Carrega arquivo CSV para DataFrame
    """
    path = Path(filepath)
    
    if not path.exists():
        logger.error(f"❌ Arquivo não encontrado: {filepath}")
        sys.exit(1)
    
    logger.info(f"📄 Carregando CSV: {filepath}")
    
    # Tenta detectar o encoding e separador automaticamente
    try:
        df = pd.read_csv(path)
    except UnicodeDecodeError:
        logger.warning("⚠️ Tentando encoding latin-1...")
        df = pd.read_csv(path, encoding='latin-1')
    except Exception as e:
        logger.error(f"❌ Erro ao ler CSV: {e}")
        sys.exit(1)
    
    logger.success(f"✅ CSV carregado: {len(df)} linhas, {len(df.columns)} colunas")
    logger.debug(f"   Colunas: {list(df.columns)}")
    
    return df


def is_date_column(series: pd.Series) -> bool:
    """
    Verifica se uma coluna parece conter datas válidas.
    Mais restritivo para evitar falsos positivos.
    """
    # Pega amostras não nulas
    samples = series.dropna().head(10)
    if len(samples) == 0:
        return False
    
    # Padrões comuns de data
    date_patterns = [
        r'^\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
        r'^\d{2}/\d{2}/\d{4}',  # DD/MM/YYYY ou MM/DD/YYYY
        r'^\d{2}-\d{2}-\d{4}',  # DD-MM-YYYY
    ]
    
    for sample in samples:
        if not isinstance(sample, str):
            continue
        # Verifica se o sample corresponde a algum padrão de data
        matches_pattern = any(re.match(p, sample.strip()) for p in date_patterns)
        if matches_pattern:
            return True
    
    return False


def prepare_documents(df: pd.DataFrame) -> list:
    """
    Converte DataFrame para lista de documentos MongoDB
    """
    logger.info("🔧 Preparando documentos...")
    
    # Converte tipos de dados para compatibilidade com MongoDB
    df = df.copy()
    
    # Trata colunas de data - apenas se realmente parecerem datas
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                if is_date_column(df[col]):
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    logger.debug(f"   Coluna '{col}' convertida para datetime")
            except Exception as e:
                logger.debug(f"   Falha ao converter '{col}': {e}")
    
    # Converte para lista de dicionários
    documents = df.to_dict('records')
    
    # Limpa valores NaN/NaT para None (MongoDB-friendly)
    import_time = datetime.utcnow()
    for doc in documents:
        for key, value in doc.items():
            # Trata NaN de float
            if isinstance(value, float) and pd.isna(value):
                doc[key] = None
            # Trata NaT de datetime
            elif pd.isna(value):
                doc[key] = None
            # Converte Timestamp pandas para datetime Python
            elif isinstance(value, pd.Timestamp):
                doc[key] = value.to_pydatetime()
        
        # Adiciona metadados
        doc['_imported_at'] = import_time
    
    logger.success(f"✅ {len(documents)} documentos preparados")
    
    return documents


def import_to_mongodb(db, collection_name: str, documents: list, 
                      drop_existing: bool = False, batch_size: int = 1000):
    """
    Importa documentos para collection do MongoDB
    """
    collection = db[collection_name]
    
    # Opcionalmente limpa a collection existente
    if drop_existing:
        existing_count = collection.count_documents({})
        if existing_count > 0:
            logger.warning(f"⚠️ Removendo {existing_count} documentos existentes...")
            collection.delete_many({})
    
    logger.info(f"📥 Importando para collection: {collection_name}")
    
    # Insere em batches para melhor performance
    total_inserted = 0
    total_docs = len(documents)
    
    for i in range(0, total_docs, batch_size):
        batch = documents[i:i + batch_size]
        try:
            result = collection.insert_many(batch, ordered=False)
            total_inserted += len(result.inserted_ids)
            progress = (i + len(batch)) / total_docs * 100
            logger.debug(f"   Progresso: {progress:.1f}% ({total_inserted}/{total_docs})")
        except BulkWriteError as e:
            # Alguns documentos podem ter falhado, mas outros foram inseridos
            total_inserted += e.details.get('nInserted', 0)
            logger.warning(f"⚠️ Alguns documentos falharam: {e.details.get('writeErrors', [])}")
    
    logger.success(f"✅ {total_inserted} documentos inseridos na collection '{collection_name}'")
    
    # Mostra estatísticas finais
    final_count = collection.count_documents({})
    logger.info(f"📊 Total de documentos na collection: {final_count}")
    
    return total_inserted


def create_indexes(db, collection_name: str, index_columns: list = None):
    """
    Cria índices para melhorar performance de queries
    """
    if not index_columns:
        return
    
    collection = db[collection_name]
    
    logger.info(f"🔍 Criando índices: {index_columns}")
    
    for col in index_columns:
        try:
            collection.create_index(col)
            logger.debug(f"   ✅ Índice criado: {col}")
        except Exception as e:
            logger.warning(f"   ⚠️ Falha ao criar índice '{col}': {e}")


def main():
    parser = argparse.ArgumentParser(
        description='Importa dados de CSV para MongoDB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python csv_to_mongodb.py navios.csv navios
  python csv_to_mongodb.py consumo.csv consumo --db hackathon
  python csv_to_mongodb.py dados.csv collection --drop
  python csv_to_mongodb.py dados.csv collection --index col1,col2
        """
    )
    
    parser.add_argument('csv_file', help='Caminho para o arquivo CSV')
    parser.add_argument('collection', help='Nome da collection no MongoDB')
    parser.add_argument('--db', '--database', default=DEFAULT_DATABASE,
                        help=f'Nome do database (default: {DEFAULT_DATABASE})')
    parser.add_argument('--uri', default=DEFAULT_MONGODB_URI,
                        help=f'URI de conexão MongoDB (default: {DEFAULT_MONGODB_URI})')
    parser.add_argument('--drop', action='store_true',
                        help='Remove documentos existentes antes de importar')
    parser.add_argument('--index', type=str, default='',
                        help='Colunas para criar índices (separadas por vírgula)')
    parser.add_argument('--batch-size', type=int, default=1000,
                        help='Tamanho do batch para inserção (default: 1000)')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Modo verbose (mostra mais detalhes)')
    
    args = parser.parse_args()
    
    # Configura nível de log
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    logger.info("🚀 CSV to MongoDB Importer")
    logger.info("=" * 50)
    
    # 1. Conecta ao MongoDB
    client, db = connect_mongodb(args.uri, args.db)
    
    try:
        # 2. Carrega CSV
        df = load_csv(args.csv_file)
        
        # 3. Prepara documentos
        documents = prepare_documents(df)
        
        # 4. Importa para MongoDB
        inserted = import_to_mongodb(
            db, 
            args.collection, 
            documents,
            drop_existing=args.drop,
            batch_size=args.batch_size
        )
        
        # 5. Cria índices (se especificado)
        if args.index:
            index_columns = [col.strip() for col in args.index.split(',')]
            create_indexes(db, args.collection, index_columns)
        
        logger.info("=" * 50)
        logger.success("✅ Importação concluída com sucesso!")
        logger.info(f"   Database: {args.db}")
        logger.info(f"   Collection: {args.collection}")
        logger.info(f"   Documentos inseridos: {inserted}")
        
    finally:
        client.close()
        logger.debug("🔌 Conexão fechada")


if __name__ == "__main__":
    main()


