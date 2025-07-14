import os
import random
import string
import sys
import shutil

OUTPUT_DIR = "random_files"

def random_filename(length=12):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length)) + '.bin'

def create_random_file(path, size):
    with open(path, 'wb') as f:
        f.write(os.urandom(size))

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <total_size_MB> <number_of_files>")
        sys.exit(1)

    try:
        total_size_mb = float(sys.argv[1])
        num_files = int(sys.argv[2])
        if total_size_mb <= 0 or num_files <= 0:
            raise ValueError
    except ValueError:
        print("Both arguments must be positive numbers. Example: python script.py 100 200")
        sys.exit(1)

    total_size_bytes = int(total_size_mb * 1024 * 1024)

    # Borrar y recrear la carpeta
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    total_written = 0
    files_created = 0

    for i in range(num_files):
        remaining_files = num_files - files_created
        remaining_bytes = total_size_bytes - total_written

        if remaining_files <= 0 or remaining_bytes <= 0:
            break

        # Estimar tamaño para este archivo: ligeramente variable
        max_allowed_size = remaining_bytes // remaining_files
        min_size = int(max_allowed_size * 0.8)
        max_size = int(max_allowed_size * 1.2)

        size = random.randint(min_size, min(max_size, remaining_bytes))

        filename = random_filename()
        filepath = os.path.join(OUTPUT_DIR, filename)
        create_random_file(filepath, size)

        total_written += size
        files_created += 1

    final_size_mb = total_written / (1024 * 1024)
    print(f"✅ Created {files_created}/{num_files} files totaling {final_size_mb:.2f} MB (target was {total_size_mb} MB).")

if __name__ == "__main__":
    main()
