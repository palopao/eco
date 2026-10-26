#!/usr/bin/env python3
"""Permite selecionar um ano e visualizar uma amostra dos álbuns da base de dados de forma dinâmica."""

from __future__ import annotations

import sqlite3
from pathlib import Path

DEFAULT_OUTPUT_DIR = Path("music")


def list_available_years(music_dir: Path) -> list[tuple[str, Path]]:
    """Devolve a lista de anos/bases de dados disponíveis."""
    available = []
    if not music_dir.exists():
        return available

    for path in sorted(music_dir.glob("*.db")):
        available.append((path.stem, path))
    
    # Ordenar numericamente se possível, senão alfabeticamente
    def sort_key(item: tuple[str, Path]):
        try:
            return (0, int(item[0]))
        except ValueError:
            return (1, item[0])

    return sorted(available, key=sort_key)


def preview_database(db_path: Path, limit: int = 5) -> None:
    """Mostra o total de registos, contagem de capas e uma amostra formatada adaptável às colunas existentes."""
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Obter colunas existentes na tabela 'albums'
        cursor.execute("PRAGMA table_info(albums)")
        columns_info = cursor.fetchall()
        column_names = [col["name"] for col in columns_info]

        if not column_names:
            print(f"\nA tabela 'albums' não existe ou não tem colunas em '{db_path.name}'.")
            return

        # Identificar coluna de capa se existir
        cover_col = None
        for candidate in ["coverUrl", "cover_url", "cover_image", "cover"]:
            if candidate in column_names:
                cover_col = candidate
                break

        # Estatísticas gerais
        cursor.execute("SELECT COUNT(*) FROM albums")
        total_albums = cursor.fetchone()[0]

        with_covers = 0
        if cover_col:
            cursor.execute(f"SELECT COUNT(*) FROM albums WHERE {cover_col} IS NOT NULL AND {cover_col} != ''")
            with_covers = cursor.fetchone()[0]

        print(f"\n" + "=" * 60)
        print(f" RESUMO DA BASE DE DADOS: {db_path.name}")
        print("=" * 60)
        print(f" Total de álbuns: {total_albums}")
        if cover_col:
            pct = (with_covers / total_albums * 100) if total_albums else 0.0
            print(f" Álbuns com capa ({cover_col}): {with_covers} / {total_albums} ({pct:.1f}%)")
        else:
            print(" Coluna de capa: Nenhuma coluna de capa detetada")
        print(f" Colunas disponíveis: {', '.join(column_names)}")
        print("=" * 60)

        # Obter amostra dinamicamente sem forçar nomes de colunas fixas
        cursor.execute(
            """
            SELECT * FROM albums
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()

        if not rows:
            print("\nA base de dados está vazia.")
            return

        print(f"\n--- AMOSTRA DE {len(rows)} ÁLBUNS (ALEATÓRIOS) ---\n")
        for idx, row in enumerate(rows, start=1):
            # Priorizar título e artista se existirem, senão mostrar os campos genéricos
            artist = row["artist"] if "artist" in column_names else "N/A"
            title = row["title"] if "title" in column_names else "N/A"
            mb_id = row["musicbrainzId"] if "musicbrainzId" in column_names else (row[column_names[0]] if column_names else "N/A")

            print(f"[{idx}] {artist} - {title}")
            print(f"    ID Principal: {mb_id}")
            
            for col in column_names:
                if col in ("artist", "title"):
                    continue
                val = str(row[col]) if row[col] is not None else "N/A"
                if len(val) > 80:
                    val = val[:77] + "..."
                print(f"    {col}: {val}")
            print("-" * 60)


def main() -> None:
    years = list_available_years(DEFAULT_OUTPUT_DIR)

    if not years:
        print(f"Nenhum ficheiro '.db' encontrado na pasta '{DEFAULT_OUTPUT_DIR}/'.")
        return

    print("Bases de dados disponíveis:")
    for idx, (label, path) in enumerate(years, start=1):
        print(f" [{idx}] {label} ({path.name})")

    while True:
        try:
            choice = input(f"\nEscolha o número do ficheiro para visualizar (1-{len(years)}) ou 'q' para sair: ").strip()
            if choice.lower() == "q":
                print("Até à próxima!")
                return

            num = int(choice)
            if 1 <= num <= len(years):
                selected_label, selected_path = years[num - 1]
                
                limit_input = input("Quantos álbuns pretende ver na amostra? (predefinição: 5): ").strip()
                limit = int(limit_input) if limit_input.isdigit() and int(limit_input) > 0 else 5

                preview_database(selected_path, limit=limit)
                break
            else:
                print("Opção inválida. Tente novamente.")
        except ValueError:
            print("Entrada inválida. Introduza um número válido.")


if __name__ == "__main__":
    main()