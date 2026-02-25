# Personality Model

This directory contains the personality analysis model for Sentio.

## Features
- Communication style detection (direct, expressive, analytical, empathetic)
- Dominant trait identification (MBTI-inspired)
- Emotional tendency analysis
- Hidden intent detection

## Default Behavior
Uses OpenAI GPT-4 for deep personality analysis when API key is available.

## Custom NLP Model
For local analysis, integrate with:
1. `sentence-transformers` for semantic similarity
2. Custom-trained classifier on communication patterns

## OCEAN Personality Traits
Sentio analyzes the Big Five personality traits:
- **O**penness, **C**onscientiousness, **E**xtraversion, **A**greeableness, **N**euroticism
