from __future__ import annotations

from functools import lru_cache


SECTION_TRAINING_DATA: list[tuple[str, str]] = [
    ("b.tech in computer science university gpa coursework academic honors", "education"),
    ("master of science bachelor degree cgpa graduation institute academic record", "education"),
    ("python java sql react docker kubernetes technical skills tools frameworks", "skills"),
    ("skills languages frameworks tools databases technologies platforms", "skills"),
    ("developed backend api project built application deployed dashboard", "projects"),
    ("project online banking system technologies spring boot mysql description", "projects"),
    ("software engineer company developed platform improved latency led feature delivery", "experience"),
    ("work experience internship responsibilities delivered features collaborated with team", "experience"),
    ("aws certified cloud practitioner coursera nptel certification scrum pmp", "certifications"),
    ("certifications licenses credential issued by valid through", "certifications"),
    ("improved performance by 40 percent reduced latency by 25 percent won hackathon", "achievements"),
    ("awards achievements accomplishment ranked first increased conversion", "achievements"),
    ("summary objective profile software engineer with experience in backend systems", "summary"),
    ("career objective motivated developer seeking role in machine learning", "summary"),
]

PROFILE_TRAINING_DATA: list[tuple[str, str]] = [
    ("python java fastapi spring boot mysql postgresql rest api microservices backend service", "Backend Developer"),
    ("sql database api authentication django flask backend architecture redis", "Backend Developer"),
    ("machine learning python pandas sklearn tensorflow pytorch nlp model evaluation", "Data Scientist"),
    ("data analysis statistics feature engineering classification regression experiment", "Data Scientist"),
    ("react javascript typescript html css frontend components ui ux responsive", "Frontend Developer"),
    ("angular vue accessibility design system frontend performance single page app", "Frontend Developer"),
    ("docker kubernetes aws linux terraform ci cd monitoring infrastructure", "DevOps Engineer"),
    ("jenkins cloud automation deployment containers observability devops sre", "DevOps Engineer"),
]

CANDIDATE_TYPE_TRAINING_DATA: list[tuple[str, str]] = [
    ("final year student academic project internship campus training certification fresher", "Fresher"),
    ("btech student capstone project intern hackathon coursework entry level fresher", "Fresher"),
    ("recent graduate projects internships technical skills objective certification", "Fresher"),
    ("software engineer 3 years experience company delivered platform led migration", "Experienced"),
    ("senior backend developer work experience architected microservices improved latency", "Experienced"),
    ("devops engineer professional experience production deployment cloud leadership", "Experienced"),
]


def predict_section_labels(blocks: list[str]) -> list[dict]:
    classifier = get_section_classifier()
    labels = classifier.predict(blocks) if blocks else []
    probabilities = classifier.predict_proba(blocks) if blocks else []
    results = []
    for index, block in enumerate(blocks):
        label = str(labels[index])
        confidence = float(max(probabilities[index])) if len(probabilities) > index else 0.0
        results.append({"text": block, "label": label, "confidence": round(confidence, 4)})
    return results


def classify_resume_profile(text: str) -> dict:
    classifier = get_profile_classifier()
    labels = [str(item) for item in classifier.classes_]
    probabilities = classifier.predict_proba([text])[0]
    predicted = str(classifier.predict([text])[0])
    ranked = sorted(
        [{"profile": labels[idx], "score": round(float(score) * 100, 2)} for idx, score in enumerate(probabilities)],
        key=lambda item: item["score"],
        reverse=True,
    )
    probability_ranked = sorted(
        [{"profile": labels[idx], "probability": round(float(score), 4)} for idx, score in enumerate(probabilities)],
        key=lambda item: item["probability"],
        reverse=True,
    )
    return {
        "predicted_profile": predicted,
        "confidence": ranked[0]["score"] if ranked else 0.0,
        "scores": ranked,
        "probabilities": probability_ranked,
    }


def classify_candidate_type(text: str) -> dict:
    classifier = get_candidate_type_classifier()
    labels = [str(item) for item in classifier.classes_]
    probabilities = classifier.predict_proba([text])[0]
    predicted = str(classifier.predict([text])[0])
    ranked = sorted(
        [{"category": labels[idx], "probability": round(float(score), 4)} for idx, score in enumerate(probabilities)],
        key=lambda item: item["probability"],
        reverse=True,
    )
    return {
        "predicted_category": predicted,
        "confidence": ranked[0]["probability"] if ranked else 0.0,
        "scores": ranked,
    }


@lru_cache(maxsize=1)
def get_section_classifier():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    model = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )
    x_train = [item[0] for item in SECTION_TRAINING_DATA]
    y_train = [item[1] for item in SECTION_TRAINING_DATA]
    model.fit(x_train, y_train)
    return model


@lru_cache(maxsize=1)
def get_profile_classifier():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    model = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )
    x_train = [item[0] for item in PROFILE_TRAINING_DATA]
    y_train = [item[1] for item in PROFILE_TRAINING_DATA]
    model.fit(x_train, y_train)
    return model


@lru_cache(maxsize=1)
def get_candidate_type_classifier():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    model = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )
    x_train = [item[0] for item in CANDIDATE_TYPE_TRAINING_DATA]
    y_train = [item[1] for item in CANDIDATE_TYPE_TRAINING_DATA]
    model.fit(x_train, y_train)
    return model
