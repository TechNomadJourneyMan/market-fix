"""
Market Fix — Entrypoint wrapper for Streamlit & Vercel.

- Running via Streamlit: `streamlit run app.py` (launches full interactive UI)
- Running via Vercel Serverless: WSGI `app` entrypoint handles HTTP requests.
"""

from streamlit_app import main


def app(environ, start_response):
    """WSGI callable for Vercel Python Serverless Runtime."""
    status = "200 OK"
    headers = [("Content-Type", "text/html; charset=utf-8")]
    start_response(status, headers)

    html = """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Market Fix — AI Marketplace Алматы</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center; }
            .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { background: linear-gradient(90deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2rem; margin-bottom: 8px; }
            p { color: #94a3b8; line-height: 1.6; }
            .btn { display: inline-block; background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
            code { background: #0f172a; padding: 8px 14px; border-radius: 6px; display: block; margin: 12px 0; color: #38bdf8; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🍽️ Market Fix</h1>
            <p>AI Marketplace заведений Алматы</p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
            <p>Vercel использует Serverless-архитектуру, которая не поддерживает постоянные WebSocket-соединения Streamlit.</p>
            <p>Для работы с полнофункциональным UI запускайте локально:</p>
            <code>streamlit run app.py</code>
            <a class="btn" href="https://github.com/TechNomadJourneyMan/market-fix" target="_blank">Репозиторий на GitHub 🚀</a>
        </div>
    </body>
    </html>
    """
    return [html.encode("utf-8")]


# Alias handler for Vercel Python runtime
handler = app

if __name__ == "__main__":
    main()
