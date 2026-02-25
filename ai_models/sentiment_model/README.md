# Sentiment Model

This directory contains the emotion/sentiment analysis model for Sentio.

## Default Behavior
By default, Sentio uses OpenAI's GPT-3.5 for sentiment analysis when an API key is provided.

## Custom Model
To use a local sentiment model:

1. **Option A: Hugging Face Transformers**
   ```python
   from transformers import pipeline
   sentiment_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
   result = sentiment_pipeline("I am so happy today!")
   ```

2. **Option B: Pre-trained BERT model**
   - Download model from: https://huggingface.co/models?pipeline_tag=text-classification
   - Place in `sentiment_model/` directory

## Supported Emotions
- happy, sad, angry, fearful, surprised, disgusted, neutral

## Integration
Update `backend/app/utils/ai_utils.py` to use the local model instead of OpenAI.
