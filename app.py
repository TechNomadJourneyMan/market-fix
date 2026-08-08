"""
Entrypoint wrapper for Market Fix Streamlit app.
Allows Vercel / WSGI / standard Python runners to detect the entrypoint.
"""

from streamlit_app import main

if __name__ == "__main__":
    main()
