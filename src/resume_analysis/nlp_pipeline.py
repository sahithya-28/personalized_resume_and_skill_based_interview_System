from __future__ import annotations

from dataclasses import dataclass
import re

from .text_processing import clean_resume_text, fallback_sentence_split, fallback_tokenize


@dataclass
class NLPArtifacts:
    cleaned_text: str
    sentences: list[str]
    tokens: list[str]
    filtered_tokens: list[str]
    lemmas: list[str]
    pos_tags: list[tuple[str, str]]
    doc: object | None = None
    engine: str = "fallback"


STOPWORDS = {
    "a", "an", "the", "and", "or", "to", "of", "in", "for", "on", "with", "by", "as",
    "at", "from", "is", "are", "was", "were", "be", "been", "being", "this", "that",
    "it", "its", "into", "using", "used", "use", "will", "can", "may",
}


def build_nlp_artifacts(text: str) -> NLPArtifacts:
    cleaned = clean_resume_text(text)

    try:
        nlp = _load_spacy_pipeline()
        if nlp is not None:
            doc = nlp(cleaned)
            sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
            tokens = [token.text for token in doc if not token.is_space]
            filtered = [token.text.lower() for token in doc if token.is_alpha and not token.is_stop]
            lemmas = [token.lemma_.lower() for token in doc if token.is_alpha and not token.is_stop]
            pos_tags = [(token.text, token.pos_ or "X") for token in doc if not token.is_space]
            return NLPArtifacts(
                cleaned_text=cleaned,
                sentences=sentences,
                tokens=tokens,
                filtered_tokens=filtered,
                lemmas=lemmas,
                pos_tags=pos_tags,
                doc=doc,
                engine="spacy",
            )
    except Exception:
        pass

    sentences = fallback_sentence_split(cleaned)
    tokens = fallback_tokenize(cleaned)
    filtered = [token for token in tokens if token not in STOPWORDS]
    lemmas = [_simple_lemma(token) for token in filtered]
    pos_tags = [(token, _fallback_pos(token)) for token in tokens]

    return NLPArtifacts(
        cleaned_text=cleaned,
        sentences=sentences,
        tokens=tokens,
        filtered_tokens=filtered,
        lemmas=lemmas,
        pos_tags=pos_tags,
        doc=None,
        engine="fallback",
    )


def _load_spacy_pipeline():
    try:
        import spacy
        from spacy.lang.en import English

        for model_name in ("en_core_web_sm",):
            try:
                return spacy.load(model_name)
            except Exception:
                continue

        nlp = English()
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
        return nlp
    except Exception:
        return None


def _simple_lemma(token: str) -> str:
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 4 and token.endswith("ing"):
        return token[:-3]
    if len(token) > 3 and token.endswith("ed"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def _fallback_pos(token: str) -> str:
    if re.fullmatch(r"\d+(?:\.\d+)?%?", token):
        return "NUM"
    if token.endswith("ing") or token.endswith("ed"):
        return "VERB"
    if token.endswith("ly"):
        return "ADV"
    if token.endswith(("ion", "ment", "ness", "ity")):
        return "NOUN"
    return "X"
