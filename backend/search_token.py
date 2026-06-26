import os

def search_files(directory, query):
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'venv', '__pycache__')]
        for file in files:
            if file.endswith('.py') or file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if query in content:
                            print(f"Found '{query}' in {filepath}")
                except Exception as e:
                    pass

search_files("c:/Users/KIIT0001/Desktop/new/civicalign/frontend/src", "civicalign_token")
