import io
import json
import os

import google.generativeai as genai


class BaseAgent:
    def __init__(self, model_name: str = 'gemini-2.5-flash'):
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    def run(self, *args, **kwargs) -> dict:
        raise NotImplementedError

    def _call_gemini(self, prompt: str, image_paths: list = None) -> str:
        parts = [prompt]

        if image_paths:
            for rel_path in image_paths[:3]:
                try:
                    # rel_path is like "uploads/images/abc.png"
                    # Resolve to absolute path from the backend root directory
                    from flask import current_app
                    full_path = os.path.normpath(
                        os.path.join(current_app.root_path, '..', rel_path)
                    )
                    with open(full_path, 'rb') as f:
                        data = f.read()
                    import PIL.Image
                    img = PIL.Image.open(io.BytesIO(data))
                    img.load()  # Ensure image is fully read before passing
                    parts.append(img)
                except Exception:
                    pass  # Skip images that can't be loaded; pipeline continues

        response = self.model.generate_content(parts)
        return response.text

    def _parse_json(self, text: str) -> dict:
        text = text.strip()
        if '```json' in text:
            text = text.split('```json', 1)[1]
            text = text.split('```', 1)[0]
        elif text.startswith('```'):
            text = text.split('```', 1)[1]
            if text.startswith('json'):
                text = text[4:]
            text = text.split('```', 1)[0]
        return json.loads(text.strip())
