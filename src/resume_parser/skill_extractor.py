import re

COMMON_SKILLS = [
    "java", "python", "c", "c++", "javascript",
    "html", "css", "react", "nodejs",
    "spring", "spring boot", "mysql", "mongodb",
    "git", "github", "docker",
    "machine learning", "deep learning", "nlp",
    "tensorflow", "pytorch",
]

def extract_skills(text: str) -> list:
    text_lower = text.lower()
    found = []

    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill.title())

    return sorted(list(set(found)))
