import os

def search_files(directory, query):
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'venv', '__pycache__')]
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if query in line:
                                print(f"Found '{query}' in {filepath}:{line_num} -> {line.strip()}")
                except Exception as e:
                    pass

search_files("c:/Users/KIIT0001/Desktop/new/civicalign/backend", "under_review")
