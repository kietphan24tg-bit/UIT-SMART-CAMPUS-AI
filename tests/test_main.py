from src.main import create_app


def test_create_app_uses_configured_root_path():
    app = create_app()

    assert app.root_path in {"", "/ai"}
