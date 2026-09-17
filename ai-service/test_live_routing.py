import json
import httpx

url = "http://127.0.0.1:8000/api/v1/route"
headers = {
    "Authorization": "Bearer digital-india-ai-internal-key-2026",
    "Content-Type": "application/json"
}

test_cases = [
    {
        "test_name": "High Confidence - Water Supply",
        "payload": {
            "subject": "Drinking water contamination and pipe leakage",
            "description": "The main drinking water supply pipeline on Sector 4 has burst. Muddy contaminated tap water is coming through connections and water tankers have not arrived."
        }
    },
    {
        "test_name": "High Confidence - Electricity",
        "payload": {
            "subject": "Frequent power outages and sparking transformer",
            "description": "Our locality has had continuous power cuts for 14 hours. The distribution transformer is sparking violently and street lights are out."
        }
    },
    {
        "test_name": "High Confidence - Roads & Transport",
        "payload": {
            "subject": "Dangerous deep potholes and broken traffic signal",
            "description": "Huge potholes on the arterial main highway causing vehicle damage and traffic jams. Traffic signals at the junction are completely non-functional."
        }
    },
    {
        "test_name": "High Confidence - Sanitation",
        "payload": {
            "subject": "Uncollected garbage and open sewer overflow",
            "description": "Solid municipal waste has been piling up on the road corner for a week. The open drainage sewer is overflowing with heavy mosquito breeding."
        }
    },
    {
        "test_name": "Low Confidence - Unrelated / Ambiguous",
        "payload": {
            "subject": "General question about weather and space",
            "description": "Can someone tell me why the sky is blue and how far the Andromeda galaxy is located from Earth?"
        }
    }
]

print("=" * 70)
print("TESTING FASTAPI AI SEMANTIC ROUTING ENGINE (LIVE SBERT PREDICTIONS)")
print("=" * 70)

with httpx.Client() as client:
    for tc in test_cases:
        print(f"\n>> TEST: {tc['test_name']}")
        print(f"   Subject: {tc['payload']['subject']}")
        res = client.post(url, headers=headers, json=tc["payload"])
        if res.status_code == 200:
            data = res.json()
            print(f"   Status Code: 200 OK")
            print(f"   Predicted Department: {data['predicted_department']}")
            print(f"   Confidence Score:     {data['confidence_score']}")
            print(f"   Routing Status:       {data['routing_status']}")
            print(f"   Top Predictions:")
            for p in data["top_predictions"]:
                print(f"     * {p['department']} ({p['code']}): {p['score']}")
            print(f"   Model: {data['model_name']} (v{data['model_version']})")
        else:
            print(f"   FAILED: {res.status_code} - {res.text}")

print("\n" + "=" * 70)
print("LIVE TESTING COMPLETE")
print("=" * 70)
