import os

# Provide a dummy API key for tests so that module-level genai.Client
# instantiations (like `agent = SmartCampusAgent()`) do not crash during
# pytest collection.
os.environ["GEMINI_KEY"] = "dummy-key-for-tests"
