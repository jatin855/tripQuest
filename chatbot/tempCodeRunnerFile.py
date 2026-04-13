"""
TripQuests — app.py
Run: python app.py
"""
from flask import Flask, session, redirect, request, send_from_directory
from flask_cors import CORS
from config import Config

def create_app():
    app = Flask(__name__, static_folder="static")
    app.secret_key = Config.SECRET_KEY
    app.config.from_object(Config)
    app.secret_key = Config.SECRET_KEY
    CORS(app)

    from api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix="/api")

    @app.route("/")
    def index(): return send_from_directory("static","index.html")

    @app.route("/collab")
    def collab(): return send_from_directory("static","collab.html")

    @app.route("/expenses")
    def expenses(): return send_from_directory("static","expenses.html")

    @app.route("/admin")
    def admin_page():
        if not session.get("admin_logged_in"):
            err = "1" if request.args.get("error") else ""
            return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>TripQuests Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'DM Sans',sans-serif;background:#1a2e1a;display:flex;align-items:center;justify-content:center;min-height:100vh}}.card{{background:#fff;padding:44px 40px;border-radius:18px;width:340px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}}h2{{font-family:'Playfair Display',serif;color:#1a2e1a;margin-bottom:4px}}h2 span{{color:#7a9e68;font-style:italic}}.sub{{color:#aaa;font-size:.8rem;margin-bottom:28px}}.err{{background:#fef0eb;color:#c4622d;padding:10px;border-radius:8px;font-size:.8rem;margin-bottom:16px;display:{"block" if err else "none"}}}label{{display:block;text-align:left;font-size:.72rem;font-weight:500;color:#3d5c2e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}}input{{width:100%;padding:12px 14px;border:1.5px solid #e8dcc8;border-radius:10px;font-size:.9rem;font-family:'DM Sans',sans-serif;outline:none;background:#f5f0e8;margin-bottom:18px;box-sizing:border-box}}input:focus{{border-color:#3d5c2e;background:#fff}}button{{width:100%;background:#1a2e1a;color:#d4a847;border:none;padding:14px;border-radius:10px;font-size:.9rem;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer}}button:hover{{background:#3d5c2e}}</style></head>
<body><div class="card"><h2>Trip<span>Quests</span></h2><div class="sub">Admin — Restricted Access</div>
<div class="err">Wrong password. Try again.</div>
<form method="POST" action="/api/admin-login"><label>Password</label>
<input type="password" name="password" placeholder="Enter admin password" autofocus/>
<button type="submit">Login</button></form></div></body></html>"""
        return send_from_directory("static","admin.html")

    @app.route("/static/<path:fn>")
    def static_files(fn): return send_from_directory("static",fn)

    return app

if __name__=="__main__":
    app = create_app()
    print("\n🌿 TripQuests starting...")
    print("🗺️  Main app  : http://localhost:5000")
    print("👥  Collab   : http://localhost:5000/collab")
    print("💰  Expenses : http://localhost:5000/expenses")
    print("⚙️  Admin    : http://localhost:5000/admin")
    print("🛑  Stop     : CTRL+C\n")
    app.run(debug=False, host=Config.HOST, port=Config.PORT)
