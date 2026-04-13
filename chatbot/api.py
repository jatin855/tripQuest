"""
api.py — All Flask routes
"""
from flask import Blueprint, request, jsonify, current_app, session, redirect, Response
from chat import get_chat_response
from csv_manager import CSVManager
from weather_distance import get_weather, get_distance, weather_emoji
from recommender import get_recommendations, explain_recommendation
from collab import (create_room, get_room, join_room, add_message,
                    add_itinerary_stop, remove_itinerary_stop,
                    add_expense, settle_expense, get_balances)

api_blueprint = Blueprint("api", __name__)
csv_manager   = CSVManager()

# ── Admin auth ─────────────────────────────────────────────
@api_blueprint.route("/admin-login", methods=["POST"])
def admin_login():
    if request.form.get("password","").strip() == current_app.config.get("ADMIN_PASSWORD",""):
        session["admin_logged_in"] = True; session.modified = True
        return redirect("/admin")
    return redirect("/admin?error=1")

@api_blueprint.route("/admin-logout")
def admin_logout():
    session.clear(); return redirect("/admin")

def _admin():
    if not session.get("admin_logged_in"):
        return jsonify({"error":"Unauthorized"}), 401
    return None

# ── Chat ───────────────────────────────────────────────────
@api_blueprint.route("/chat", methods=["POST"])
def chat():
    body = request.get_json(silent=True) or {}
    msg  = body.get("message","").strip()
    lang = body.get("language","English")
    if not msg: return jsonify({"error":"message required"}),400
    key = current_app.config.get("GROQ_API_KEY","")
    if not key: return jsonify({"error":"Groq API key not set in .env"}),500
    locations = csv_manager.load_locations()

    # Load conversation history from session (keeps last 10 turns = 5 exchanges)
    chat_history = session.get("chat_history", [])

    reply = get_chat_response(msg, locations, key,
                              current_app.config.get("GROQ_MODEL","llama-3.3-70b-versatile"),
                              current_app.config.get("MAX_TOKENS",1500), lang,
                              history=chat_history)

    # Append this exchange to history and save back to session
    chat_history.append({"role": "user",      "content": msg})
    chat_history.append({"role": "assistant", "content": reply})
    session["chat_history"] = chat_history[-20:]  # keep last 10 exchanges
    session.modified = True

    return jsonify({"reply": reply})

# ── Locations ──────────────────────────────────────────────
@api_blueprint.route("/locations")
def get_locations():
    locs = csv_manager.load_locations()
    return jsonify({**csv_manager.stats(),"locations":locs})

# ── Weather ────────────────────────────────────────────────
@api_blueprint.route("/weather/<city>")
def weather(city):
    key = current_app.config.get("WEATHER_API_KEY","")
    if not key: return jsonify({"error":"Weather key not set"}),500
    d = get_weather(city, key)
    if not d: return jsonify({"error":"City not found"}),404
    d["emoji"] = weather_emoji(d["condition"], d["is_day"])
    return jsonify(d)

# ── Distance ───────────────────────────────────────────────
@api_blueprint.route("/distance")
def distance():
    orig = request.args.get("from","").strip()
    dest = request.args.get("to","").strip()
    if not orig or not dest: return jsonify({"error":"Need from and to"}),400
    key = current_app.config.get("ORS_API_KEY","")
    d = get_distance(orig, dest, key)
    if not d: return jsonify({"error":"Could not calculate"}),404
    return jsonify(d)

# ── Track view ─────────────────────────────────────────────
@api_blueprint.route("/track-view", methods=["POST"])
def track_view():
    name = (request.get_json(silent=True) or {}).get("place_name","").strip()
    if not name: return jsonify({"error":"place_name required"}),400
    history = session.get("view_history",[])
    history = [h for h in history if h.lower()!=name.lower()]
    history.insert(0,name)
    session["view_history"] = history[:20]
    session.modified = True
    return jsonify({"ok":True})

# ── Recommendations ────────────────────────────────────────
@api_blueprint.route("/recommendations")
def recommendations():
    history   = session.get("view_history",[])
    locations = csv_manager.load_locations()
    recs      = get_recommendations(history, locations, top_n=int(request.args.get("n",4)))
    hist_locs = [l for l in locations if l.get("Place Name","") in history]
    result = [{"Place Name":r.get("Place Name",""),"City":r.get("City",""),
               "Category":r.get("Category",""),"Vibe Description":r.get("Vibe Description",""),
               "Budget":r.get("Budget","").replace("₹","Rs.").replace("?","Rs."),
               "type of location":r.get("type of location",""),
               "reason":explain_recommendation(r,hist_locs)} for r in recs]
    return jsonify({"recommendations":result,"based_on":history[:5],"history_count":len(history)})

@api_blueprint.route("/clear-history", methods=["POST"])
def clear_history():
    session.pop("view_history",None)
    session.pop("chat_history",None)
    session.modified=True
    return jsonify({"ok":True})

# ── Submit gem ─────────────────────────────────────────────
@api_blueprint.route("/submit-gem", methods=["POST"])
def submit_gem():
    data = request.get_json(silent=True) or {}
    for f in ["name","city","category","description"]:
        if not data.get(f): return jsonify({"error":f"'{f}' required"}),400
    return jsonify({"message":"Submitted! Pending admin review.","gem_id":csv_manager.add_pending_gem(data)})

# ── Admin routes ───────────────────────────────────────────
@api_blueprint.route("/upload-csv", methods=["POST"])
def upload_csv():
    e=_admin();
    if e: return e
    if "csv_file" not in request.files: return jsonify({"error":"No file"}),400
    f = request.files["csv_file"]
    if not f.filename.lower().endswith(".csv"): return jsonify({"error":"CSV only"}),400
    try:
        count,preview = csv_manager.upload_csv(f)
        return jsonify({"message":f"CSV loaded — {count} locations.","count":count,"preview":preview[:10]})
    except Exception as ex: return jsonify({"error":str(ex)}),500

@api_blueprint.route("/pending-gems")
def get_pending_gems():
    e=_admin();
    if e: return e
    p=csv_manager.get_pending_gems(); return jsonify({"pending":p,"count":len(p)})

@api_blueprint.route("/approve-gem/<gid>", methods=["POST"])
def approve_gem(gid):
    e=_admin();
    if e: return e
    try: gem=csv_manager.approve_gem(gid); return jsonify({"message":f"'{gem['Place Name']}' approved!"})
    except ValueError as ex: return jsonify({"error":str(ex)}),404

@api_blueprint.route("/reject-gem/<gid>", methods=["POST"])
def reject_gem(gid):
    e=_admin();
    if e: return e
    try: csv_manager.reject_gem(gid); return jsonify({"message":"Rejected."})
    except ValueError as ex: return jsonify({"error":str(ex)}),404

@api_blueprint.route("/export-csv")
def export_csv():
    e=_admin();
    if e: return e
    return Response(csv_manager.export_csv(),mimetype="text/csv",
                    headers={"Content-Disposition":"attachment; filename=tripquests_locations.csv"})

# ── Collaborative rooms ────────────────────────────────────
@api_blueprint.route("/room/create", methods=["POST"])
def room_create():
    body = request.get_json(silent=True) or {}
    creator   = body.get("creator","").strip()
    trip_name = body.get("trip_name","My Trip").strip()
    if not creator: return jsonify({"error":"creator name required"}),400
    room = create_room(creator, trip_name)
    return jsonify(room)

@api_blueprint.route("/room/<rid>")
def room_get(rid):
    room = get_room(rid)
    if not room: return jsonify({"error":"Room not found"}),404
    return jsonify(room)

@api_blueprint.route("/room/<rid>/join", methods=["POST"])
def room_join(rid):
    name = (request.get_json(silent=True) or {}).get("name","").strip()
    if not name: return jsonify({"error":"name required"}),400
    try: return jsonify(join_room(rid, name))
    except ValueError as e: return jsonify({"error":str(e)}),404

@api_blueprint.route("/room/<rid>/message", methods=["POST"])
def room_message(rid):
    body   = request.get_json(silent=True) or {}
    sender = body.get("sender","").strip()
    text   = body.get("text","").strip()
    if not sender or not text: return jsonify({"error":"sender and text required"}),400
    msg = add_message(rid, sender, text)
    return jsonify(msg)

@api_blueprint.route("/room/<rid>/itinerary", methods=["POST"])
def room_add_stop(rid):
    body = request.get_json(silent=True) or {}
    added_by = body.get("added_by","").strip()
    stop = {"day":body.get("day","Day 1"),"time":body.get("time",""),
            "place":body.get("place","").strip(),"city":body.get("city","").strip(),
            "note":body.get("note","").strip()}
    if not stop["place"]: return jsonify({"error":"place required"}),400
    return jsonify(add_itinerary_stop(rid, added_by, stop))

@api_blueprint.route("/room/<rid>/itinerary/<stop_id>", methods=["DELETE"])
def room_remove_stop(rid, stop_id):
    try: remove_itinerary_stop(rid, stop_id); return jsonify({"ok":True})
    except ValueError as e: return jsonify({"error":str(e)}),404

# ── Expense Splitter ───────────────────────────────────────
@api_blueprint.route("/room/<rid>/expense", methods=["POST"])
def room_add_expense(rid):
    body = request.get_json(silent=True) or {}
    paid_by     = body.get("paid_by","").strip()
    description = body.get("description","").strip()
    amount      = body.get("amount",0)
    split_among = body.get("split_among",[])
    if not paid_by or not description or not amount or not split_among:
        return jsonify({"error":"paid_by, description, amount, split_among required"}),400
    try:
        exp = add_expense(rid, paid_by, description, float(amount), split_among)
        return jsonify(exp)
    except Exception as e: return jsonify({"error":str(e)}),500

@api_blueprint.route("/room/<rid>/expense/<eid>/settle", methods=["POST"])
def room_settle(rid, eid):
    member = (request.get_json(silent=True) or {}).get("member","").strip()
    if not member: return jsonify({"error":"member required"}),400
    settle_expense(rid, eid, member)
    return jsonify({"ok":True})

@api_blueprint.route("/room/<rid>/balances")
def room_balances(rid):
    try: return jsonify(get_balances(rid))
    except Exception as e: return jsonify({"error":str(e)}),500

@api_blueprint.route("/health")
def health():
    return jsonify({"status":"ok","groq":bool(current_app.config.get("GROQ_API_KEY")),
                    "weather":bool(current_app.config.get("WEATHER_API_KEY")),
                    "ors":bool(current_app.config.get("ORS_API_KEY")),**csv_manager.stats()})
