#!/usr/bin/env python3
"""
scripts/demo.py

A live, narrated walkthrough of the Agricultural Super App backend --
run against a REAL running server (not the test client, not mocks),
so every request in this script is a genuine HTTP round-trip through
the actual application.

Usage:
    # Terminal 1: start the real server
    export FLASK_APP=wsgi.py FLASK_ENV=development
    flask run

    # Terminal 2: run the demo
    pip install requests   # only needed for this script, not the app itself
    python scripts/demo.py

What this proves, step by step:
  1. The app boots and responds (health check).
  2. Registration + JWT issuance actually works.
  3. THE SECURITY FIX: self-registering as "admin" is rejected -- proof
     the privilege-escalation hole found during code review is closed,
     demonstrated live rather than just claimed.
  4. Full core feature set: posts, images, comments, likes, communities,
     membership, conversations, messages -- all as real HTTP calls.
  5. Authorization actually holds: a non-owner is blocked (403) from
     editing someone else's post.
  6. Error handling: a request for a nonexistent resource gets a clean
     JSON 404, never a stack trace.

Every assertion in this script is a real check against a real response --
if the app were broken, this script would fail loudly, not just print
green checkmarks blindly.
"""

import sys

import requests

BASE_URL = "http://localhost:5000"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

step_number = 0


def banner(title):
    global step_number
    step_number += 1
    print(f"\n{BOLD}{'=' * 70}{RESET}")
    print(f"{BOLD} STEP {step_number}: {title}{RESET}")
    print(f"{BOLD}{'=' * 70}{RESET}")


def show(method, path, response, note=""):
    color = GREEN if response.status_code < 400 else YELLOW
    print(f"{method} {path} -> {color}{response.status_code}{RESET}  {note}")
    try:
        body = response.json()
        print(_truncate(body))
    except ValueError:
        print(response.text)


def _truncate(obj, max_chars=500):
    import json

    text = json.dumps(obj, indent=2, default=str)
    if len(text) > max_chars:
        return text[:max_chars] + "\n  ... (truncated for readability)"
    return text


def check(label, condition):
    if condition:
        print(f"{GREEN}\u2713 {label}{RESET}")
    else:
        print(f"{RED}\u2717 FAILED: {label}{RESET}")
        sys.exit(1)


def main():
    print(f"{BOLD}Agricultural Super App -- Live Backend Demo{RESET}")
    print(f"Target: {BASE_URL}\n")

    try:
        requests.get(f"{BASE_URL}/health", timeout=2)
    except requests.exceptions.ConnectionError:
        print(f"{RED}Could not reach {BASE_URL}. Is `flask run` running in another terminal?{RESET}")
        sys.exit(1)

    # --- 1. Health check ---------------------------------------------------
    banner("Health check")
    r = requests.get(f"{BASE_URL}/health")
    show("GET", "/health", r)
    check("Server is up", r.status_code == 200)

    # --- 2. Registration -----------------------------------------------------
    banner("Register two users: Amina (farmer) and Brian (expert)")
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"username": "amina_demo", "email": "amina_demo@example.com", "password": "Supersecret123!"},
    )
    show("POST", "/api/auth/register", r, note="(Amina, default role)")
    check("Amina registered", r.status_code == 201)
    amina_token = r.json()["token"]
    amina_id = r.json()["user"]["id"]
    amina = requests.Session()
    amina.headers.update({"Authorization": f"Bearer {amina_token}"})

    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": "brian_demo",
            "email": "brian_demo@example.com",
            "password": "Anothersecret123!",
            "role": "expert",
        },
    )
    show("POST", "/api/auth/register", r, note="(Brian, role=expert)")
    check("Brian registered as expert", r.status_code == 201 and r.json()["user"]["role"] == "expert")
    brian_id = r.json()["user"]["id"]
    brian = requests.Session()
    brian.headers.update({"Authorization": f"Bearer {r.json()['token']}"})

    # --- 3. The security fix, demonstrated live -------------------------------
    banner("SECURITY CHECK: attempt to self-register as admin")
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": "hacker_demo",
            "email": "hacker_demo@example.com",
            "password": "Hackerpass123!",
            "role": "admin",
        },
    )
    show("POST", "/api/auth/register", r, note="(role=admin -- should be REJECTED)")
    check("Self-registration as admin is blocked (422)", r.status_code == 422)

    # --- 4. Profile ---------------------------------------------------------
    banner("Amina fills out her profile")
    r = amina.put(
        f"{BASE_URL}/api/users/me/profile",
        json={"first_name": "Amina", "bio": "Maize farmer in Nakuru"},
    )
    show("PUT", "/api/users/me/profile", r)
    check("Profile updated", r.status_code == 200 and r.json()["first_name"] == "Amina")

    # --- 5. Posts -------------------------------------------------------------
    banner("Amina creates a post with an image")
    r = amina.post(
        f"{BASE_URL}/api/posts",
        json={
            "title": "Maize planting tips",
            "content": "Plant in rows 75cm apart.",
            "images": [{"image_url": "https://example.com/maize.jpg"}],
        },
    )
    show("POST", "/api/posts", r)
    check("Post created with nested author + image", r.status_code == 201 and r.json()["author"]["username"] == "amina_demo")
    post_id = r.json()["id"]

    banner("Brian comments on and likes Amina's post")
    r = brian.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={"content": "Great tips, thanks!"})
    show("POST", f"/api/posts/{post_id}/comments", r)
    check("Comment added", r.status_code == 201)

    r = brian.post(f"{BASE_URL}/api/posts/{post_id}/like")
    show("POST", f"/api/posts/{post_id}/like", r)
    check("Post liked", r.status_code == 201)

    # --- 6. Authorization actually holds --------------------------------------
    banner("AUTHORIZATION CHECK: Brian tries to edit Amina's post")
    r = brian.put(f"{BASE_URL}/api/posts/{post_id}", json={"title": "Hijacked!"})
    show("PUT", f"/api/posts/{post_id}", r, note="(Brian is not the owner -- should be REJECTED)")
    check("Non-owner edit is blocked (403)", r.status_code == 403)

    # --- 7. Communities -------------------------------------------------------
    banner("Amina creates a community; Brian joins it")
    r = amina.post(f"{BASE_URL}/api/communities", json={"name": f"Maize Farmers Demo", "description": "For growers"})
    show("POST", "/api/communities", r)
    check("Community created, creator auto-joined", r.status_code == 201)
    community_id = r.json()["id"]

    r = brian.post(f"{BASE_URL}/api/communities/{community_id}/members")
    show("POST", f"/api/communities/{community_id}/members", r)
    check("Brian joined the community", r.status_code == 201)

    # --- 8. Messaging -----------------------------------------------------------
    banner("Amina starts a conversation with Brian and sends a message")
    r = amina.post(f"{BASE_URL}/api/conversations", json={"participant_ids": [brian_id]})
    show("POST", "/api/conversations", r)
    check("Conversation started with both participants", r.status_code == 201 and len(r.json()["participants"]) == 2)
    convo_id = r.json()["id"]

    r = amina.post(f"{BASE_URL}/api/conversations/{convo_id}/messages", json={"content": "Hey Brian, thanks for joining!"})
    show("POST", f"/api/conversations/{convo_id}/messages", r)
    check("Message sent, unread by default", r.status_code == 201 and r.json()["is_read"] is False)
    message_id = r.json()["id"]

    r = brian.patch(f"{BASE_URL}/api/messages/{message_id}/read")
    show("PATCH", f"/api/messages/{message_id}/read", r)
    check("Brian marked the message read", r.status_code == 200 and r.json()["is_read"] is True)

    # --- 9. Error handling -----------------------------------------------------
    banner("ERROR HANDLING: request a post that doesn't exist")
    r = requests.get(f"{BASE_URL}/api/posts/999999")
    show("GET", "/api/posts/999999", r, note="(clean JSON error, never a stack trace)")
    check("Unknown resource returns clean JSON 404", r.status_code == 404 and "error" in r.json())

    # --- Summary -----------------------------------------------------------------
    print(f"\n{BOLD}{'=' * 70}{RESET}")
    print(f"{GREEN}{BOLD} ALL {step_number} DEMO STEPS PASSED{RESET}")
    print(f"{BOLD}{'=' * 70}{RESET}")
    print(
        "\nEvery request above was a real HTTP call to a running Flask server,\n"
        "backed by a real database, with real password hashing, real JWT\n"
        "verification, and real authorization checks -- nothing in this\n"
        "script is mocked or simulated."
    )


if __name__ == "__main__":
    main()
