import os
import sys

FILENAME = "bigfile.bin"

def create_large_file(path, size):
    with open(path, 'wb') as f:
        f.write(os.urandom(size))

def main():
    if len(sys.argv) != 2:
        print("Uso: python random_file_gen.py <tamaño_en_MB>")
        sys.exit(1)

    try:
        size_mb = float(sys.argv[1])
    except ValueError:
        print("El tamaño debe ser un número (puede tener decimales).")
        sys.exit(1)

    size_bytes = int(size_mb * 1024 * 1024)
    file_path = os.path.join(os.getcwd(), FILENAME)

    print(f"Creando archivo de {size_mb} MB en {file_path}...")
    create_large_file(file_path, size_bytes)
    print("Archivo creado exitosamente.")

if __name__ == "__main__":
    main()
