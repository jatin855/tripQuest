"""
chat.py - Groq AI with multilingual support
Friendly tone, only plans when asked
"""
from groq import Groq


def _is_hidden_gem(loc):
    v = loc.get("type of location", "").lower()
    return "hidden" in v or "local" in v


def _build_context(locations):
    if not locations:
        return "No locations loaded yet."
    lines = []
    for loc in locations[:8]:
        badge = "HIDDEN GEM" if _is_hidden_gem(loc) else "Official"
        lines.append(
            f"{loc.get('Place Name','')} | {loc.get('City','')} | "
            f"{loc.get('Category','')} | {loc.get('Vibe Description','')} | "
            f"Budget: {loc.get('Budget','').replace('?', 'Rs.').replace('₹', 'Rs.')} | Best Time: {loc.get('Best time to visit in each season','')} | "
            f"Food: {loc.get('food to try','')} | {badge}"
        )
    return "\n".join(lines)


def _build_system_prompt(locations, language="English"):
    ctx = _build_context(locations)
    lang_note = f"You MUST respond entirely in {language}." if language != "English" else ""

    return f"""You are a well-travelled local friend who knows all the hidden gems. You are warm, casual and fun to talk to. You speak like a real person, not a tour guide or a robot.
{lang_note}

YOUR PERSONALITY:
- Talk like a friend texting a friend. Short sentences. Casual tone.
- Use "you should check out", "honestly this place is underrated", "trust me on this one" etc.
- Never use formal language like "certainly", "absolutely", "I would recommend".
- Never write long boring paragraphs. Keep it punchy and real.
- Use emojis naturally but not excessively.

RESPONSE RULES - VERY IMPORTANT:
1. If the user says hi, hello, hey or any greeting - just greet them back casually and ask where they want to go or what they are planning. DO NOT generate an itinerary unprompted.
2. Only plan an itinerary if the user EXPLICITLY asks for one (e.g. "plan a trip", "make an itinerary", "what should I do in X for Y days").
3. If the user asks about a specific place - describe it like you have been there. Share what makes it special, the vibe, what to eat, best time to go. Keep it to 3-5 lines max unless they ask for more detail.
4. If the user asks for an itinerary - give a brief day-by-day plan first. If they want more detail on any day or stop, they will ask.
5. Never repeat yourself. Never pad the response.
6. Always finish your response completely. Never cut off mid-sentence.

LOCATION DATABASE (use these for recommendations):
{ctx}

ITINERARY FORMAT (only when asked):
Day 1: Morning - [place] ([budget]) | Afternoon - [place] | Evening - [place]
Keep each day to one line unless they ask for detail."""


def get_chat_response(message, locations, api_key,
                      model="llama-3.1-8b-instant",
                      max_tokens=600, language="English",
                      history=None):
    """
    history: list of {"role": "user"|"assistant", "content": str}
    Pass the last N turns so the AI remembers the conversation context.
    """
    try:
        client = Groq(api_key=api_key)
        messages = [{"role": "system", "content": _build_system_prompt(locations, language)}]
        # Include conversation history for context (last 10 turns = 5 exchanges)
        if history:
            messages.extend(history[-10:])
        messages.append({"role": "user", "content": message})
        response = client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=messages
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"