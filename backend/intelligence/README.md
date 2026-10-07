# Sales Conversation Intelligence Modules

## Pipeline

Audio -> Speech-to-Text -> Speaker Diarization -> Sentence Timestamping -> Chunking -> Gemini JSON Analysis -> KPI Engine -> Risk Engine -> Deal Decision Engine -> Supabase

The API expects diarized sentence-level inputs:

- text
- startSec
- endSec
- speakerId
- speakerRole (buyer or rep)

## API Endpoints

- GET /api/intelligence/prompt
- POST /api/intelligence/analyze
- POST /api/intelligence/kpi
- POST /api/intelligence/risk
- POST /api/intelligence/deal-decision

## Example Request

{
  "transcript": "Buyer: We may need to evaluate budget and timeline...",
  "diarized_sentences": [
    {
      "text": "Can we do this this quarter?",
      "startSec": 15,
      "endSec": 19,
      "speakerId": "spk_1",
      "speakerRole": "buyer"
    },
    {
      "text": "Yes, we can schedule implementation next week.",
      "startSec": 20,
      "endSec": 25,
      "speakerId": "spk_2",
      "speakerRole": "rep"
    }
  ],
  "gemini": {
    "sentiment": { "score": 0.62, "label": "positive" },
    "buyer_intent": "Evaluating options",
    "objections": [{ "text": "Budget concerns", "resolved": true }],
    "buying_signals": {
      "budget": ["Budget available in Q2"],
      "timeline": ["Implement this quarter"],
      "authority": ["I will include our CFO"],
      "competition": ["Comparing with competitor X"]
    },
    "key_moments": ["Buyer asked for implementation timeline"],
    "next_steps_detected": true
  }
}

## Example Response

{
  "ok": true,
  "data": {
    "kpi": {
      "buyer_engagement": {
        "talk_to_listen_ratio": 1.18,
        "buyer_participation_rate": 42.7,
        "buyer_question_density": 0.36,
        "interruption_count": 2
      },
      "deal_health": {
        "sentiment_trend": "improving",
        "momentum_score": 74,
        "objection_frequency": 1,
        "objection_resolution_rate": 100
      },
      "rep_effectiveness": {
        "discovery_depth_score": 66,
        "value_articulation_rate": 54,
        "objection_handling_quality": 100,
        "next_step_clarity_score": 85
      },
      "timeline": {
        "sentiment_timeline": [],
        "risk_timeline": []
      }
    },
    "risk": {
      "risk_score": 34,
      "ghosting_probability": 28,
      "red_flags": [],
      "risk_reasons": []
    },
    "deal": {
      "deal_status": "NEEDS_FOLLOWUP",
      "assistant_suggestions": [
        "Ask a clear next step: 'Shall we schedule the next call?'"
      ],
      "recommended_next_message": "Great discussion so far. To keep momentum, can we align on your requirement and schedule a concrete follow-up date?"
    },
    "gemini": {}
  }
}
