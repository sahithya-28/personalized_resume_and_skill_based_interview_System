from __future__ import annotations

import re


SECTION_ALIASES = {
    "summary": {"summary", "profile", "objective", "professional summary", "career objective"},
    "skills": {"skills", "technical skills", "core skills", "tools", "technologies"},
    "education": {"education", "academic background", "academic", "qualifications"},
    "experience": {"experience", "work experience", "professional experience", "employment", "internship", "internships"},
    "projects": {"projects", "project", "personal projects", "academic projects", "project experience"},
    "certifications": {
        "certifications", "certification", "licenses", "credentials", "certificates", "courses",
        "training", "programs", "certifications and achievements", "achievements and certifications",
    },
    "achievements": {
        "achievements", "achievement", "awards", "accomplishments", "activities", "hackathons",
        "participation", "certifications and achievements", "achievements and certifications",
    },
}


def normalize_resume_schema(
    *,
    parsed_data: dict | None,
    sections: dict | None,
    structured_sections: list[dict] | None,
    skills: list[str] | None,
    project_analysis: list[dict] | None = None,
    raw_text: str = "",
) -> dict:
    parsed_data = parsed_data or {}
    sections = sections or {}
    structured_sections = structured_sections or []
    skills = skills or []
    project_analysis = project_analysis or []

    mapped_sections = _collect_section_content(sections, structured_sections)
    inline_sections = _extract_inline_sections(raw_text)
    mapped_sections = _merge_mapped_sections(mapped_sections, inline_sections)
    mapped_sections = _prune_cross_section_noise(mapped_sections)

    normalized_skills = _extract_skill_list(skills, mapped_sections.get("skills", []))
    summary = _extract_summary(mapped_sections, normalized_skills)
    education = _parse_education_entries(mapped_sections.get("education", []))
    experience = _parse_experience_entries(mapped_sections.get("experience", []))
    projects = _parse_project_entries(
        project_analysis,
        mapped_sections.get("projects", []),
        normalized_skills,
        candidate_name=str(parsed_data.get("name", "")).strip(),
        raw_text=raw_text,
    )
    split_sections = _split_certifications_and_achievements(
        mapped_sections.get("certifications", []),
        mapped_sections.get("achievements", []),
    )
    certifications = split_sections["certifications"]
    achievements = split_sections["achievements"]
    if not normalized_skills:
        normalized_skills = _infer_skills_from_entries(projects, experience)
    if not summary:
        summary = _infer_summary(normalized_skills, experience, projects, parsed_data)
    extra_sections = _build_extra_sections(mapped_sections)

    return {
        "name": str(parsed_data.get("name", "")).strip(),
        "contact": {
            "email": str(parsed_data.get("email", "")).strip(),
            "phone": str(parsed_data.get("phone", "")).strip(),
            "linkedin": str(parsed_data.get("linkedin", "")).strip(),
            "github": str(parsed_data.get("github", "")).strip(),
        },
        "summary": summary,
        "skills": normalized_skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "achievements": achievements,
        "extra_sections": extra_sections,
        "source_sections": list(mapped_sections.keys()),
        "section_mapping": _build_section_mapping(structured_sections, sections),
        "raw_text": raw_text.strip(),
    }


def _collect_section_content(sections: dict, structured_sections: list[dict]) -> dict[str, list[str]]:
    collected: dict[str, list[str]] = {}

    for key, value in sections.items():
        text = str(value or "").strip()
        if not text:
            continue
        for canonical in _canonical_section_targets(key):
            collected.setdefault(canonical, []).append(text)

    for item in structured_sections:
        title = str(item.get("title") or item.get("key") or "").strip()
        key = str(item.get("key") or "").strip()
        content = item.get("content")
        lines = content if isinstance(content, list) else [content]
        text = "\n".join(str(line or "").strip() for line in lines if str(line or "").strip()).strip()
        if not text:
            continue
        for canonical in _canonical_section_targets(title or key):
            if text not in collected.get(canonical, []):
                collected.setdefault(canonical, []).append(text)

    return collected


def _merge_mapped_sections(primary: dict[str, list[str]], secondary: dict[str, list[str]]) -> dict[str, list[str]]:
    merged = {key: list(values) for key, values in primary.items()}
    for key, values in secondary.items():
        target = merged.setdefault(key, [])
        for value in values:
            cleaned = str(value or "").strip()
            if cleaned and cleaned not in target:
                target.append(cleaned)
    return merged


def _prune_cross_section_noise(mapped_sections: dict[str, list[str]]) -> dict[str, list[str]]:
    cleaned: dict[str, list[str]] = {}
    heading_tokens = {
        canonical: [alias.upper() for alias in (aliases | {canonical})]
        for canonical, aliases in SECTION_ALIASES.items()
    }

    for canonical, blocks in mapped_sections.items():
        sanitized_blocks: list[str] = []
        for block in blocks:
            text = str(block or "").strip()
            if not text:
                continue
            foreign_heading_count = 0
            upper_text = text.upper()
            for other_canonical, tokens in heading_tokens.items():
                if other_canonical == canonical:
                    continue
                if any(token in upper_text for token in tokens):
                    foreign_heading_count += 1
            if foreign_heading_count >= 2 and canonical in {"projects", "experience", "education", "skills"}:
                continue
            sanitized_blocks.append(text)
        cleaned[canonical] = sanitized_blocks
    return cleaned


def _canonical_section_name(name: str) -> str:
    normalized = re.sub(r"[^a-z\s]", " ", str(name or "").lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    for canonical, aliases in SECTION_ALIASES.items():
        if normalized == canonical or normalized in aliases:
            return canonical
    return normalized or "other"


def _canonical_section_targets(name: str) -> list[str]:
    normalized = re.sub(r"[^a-z\s&]", " ", str(name or "").lower())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return ["other"]
    if ("cert" in normalized or "course" in normalized or "training" in normalized) and (
        "achievement" in normalized or "activity" in normalized or "hackathon" in normalized or "participation" in normalized
    ):
        return ["certifications", "achievements"]
    return [_canonical_section_name(normalized)]


def _extract_inline_sections(raw_text: str) -> dict[str, list[str]]:
    text = str(raw_text or "").strip()
    if not text:
        return {}

    alias_patterns = []
    for canonical, aliases in SECTION_ALIASES.items():
        for alias in sorted(aliases | {canonical}, key=len, reverse=True):
            alias_patterns.append((canonical, alias))

    matches: list[tuple[int, int, str, str]] = []
    for canonical, alias in alias_patterns:
        pattern = re.compile(rf"(?<![A-Za-z]){re.escape(alias)}(?![A-Za-z])", flags=re.IGNORECASE)
        for match in pattern.finditer(text):
            token = match.group(0)
            # Prefer heading-like occurrences where the alias is uppercase/title-ish in the raw text.
            if not _looks_like_heading_token(token):
                continue
            matches.append((match.start(), match.end(), canonical, token))

    if not matches:
        return {}

    matches.sort(key=lambda item: item[0])
    deduped: list[tuple[int, int, str, str]] = []
    for item in matches:
        if deduped and item[0] < deduped[-1][1]:
            continue
        deduped.append(item)

    output: dict[str, list[str]] = {}
    for index, (start, end, canonical, _) in enumerate(deduped):
        next_start = deduped[index + 1][0] if index + 1 < len(deduped) else len(text)
        content = text[end:next_start].strip(" :-\n\t")
        if not content:
            continue
        output.setdefault(canonical, []).append(_cleanup_inline_content(content))
    return output


def _looks_like_heading_token(token: str) -> bool:
    stripped = str(token or "").strip()
    if not stripped:
        return False
    letters = [char for char in stripped if char.isalpha()]
    if not letters:
        return False
    uppercase_ratio = sum(1 for char in letters if char.isupper()) / len(letters)
    return uppercase_ratio >= 0.6 or stripped.istitle()


def _cleanup_inline_content(content: str) -> str:
    text = str(content or "").strip()
    text = re.sub(r"\s{2,}", " ", text)
    # Add line breaks before known headings if OCR glued sections together.
    for canonical, aliases in SECTION_ALIASES.items():
        for alias in sorted(aliases | {canonical}, key=len, reverse=True):
            pattern = re.compile(rf"\s+({re.escape(alias)})\s+", flags=re.IGNORECASE)
            text = pattern.sub(lambda m: f"\n{m.group(1).upper()}\n", text)
    return text.strip()


def _extract_summary(mapped_sections: dict[str, list[str]], skills: list[str]) -> str:
    parts = mapped_sections.get("summary", [])
    if parts:
        return _clean_summary(parts[0].strip())
    if skills:
        return ""
    return ""


def _extract_skill_list(detected_skills: list[str], skill_sections: list[str]) -> list[str]:
    found: list[str] = []
    seen = set()

    for skill in detected_skills:
        text = str(skill or "").strip()
        key = text.lower()
        if text and key not in seen:
            seen.add(key)
            found.append(text)

    for block in skill_sections:
        cleaned = re.sub(r"(?i)\bskills?\b[:\-\s]*", "", block)
        pieces = re.split(r"[\n,|/•]+", cleaned)
        for piece in pieces:
            text = piece.strip(" -:\t")
            if not text or len(text) < 2:
                continue
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)
            found.append(text)

    return found


def _parse_education_entries(blocks: list[str]) -> list[dict]:
    entries: list[dict] = []
    for block in blocks:
        for chunk in _split_blocks(block):
            lines = _clean_lines(chunk)
            if not lines:
                continue
            degree = lines[0]
            institution = lines[1] if len(lines) > 1 else ""
            year = _extract_year_range(" ".join(lines))
            score_match = re.search(r"(?i)\b(?:cgpa|gpa|percentage|score)\b[:\s-]*([A-Za-z0-9.%/]+)", " ".join(lines))
            entries.append(
                {
                    "degree": degree,
                    "institution": institution,
                    "year": year,
                    "score": score_match.group(1).strip() if score_match else "",
                }
            )
    return _dedupe_dicts(entries, ("degree", "institution", "year"))


def _parse_experience_entries(blocks: list[str]) -> list[dict]:
    entries: list[dict] = []
    for block in blocks:
        for chunk in _split_blocks(block):
            lines = _clean_lines(chunk)
            if not lines:
                continue
            header = lines[0]
            role, company = _split_role_company(header)
            duration = _extract_duration(" ".join(lines[:3]))
            description = _to_bullets(lines[1:] if len(lines) > 1 else [])
            if not role or (not company and not duration):
                continue
            entries.append(
                {
                    "role": role,
                    "company": company,
                    "duration": duration,
                    "description": _limit_bullets(description, max_items=5),
                }
            )
    return _dedupe_dicts(entries, ("role", "company", "duration"))


def _parse_project_entries(
    project_analysis: list[dict],
    blocks: list[str],
    skills: list[str],
    *,
    candidate_name: str,
    raw_text: str,
) -> list[dict]:
    if project_analysis:
        output = []
        for project in project_analysis:
            title = str(project.get("project_name", "")).strip()
            if _looks_like_noise_title(title, candidate_name=candidate_name):
                continue
            project_bullets = _limit_bullets(
                [item for item in _to_bullets([str(project.get("description", "")).strip()]) if not _looks_like_noise_sentence(item)],
                max_items=5,
            )
            if len(project_bullets) < 2:
                project_bullets = _recover_project_bullets(str(project.get("description", "")).strip(), skills)
            if len(project_bullets) < 2:
                continue
            output.append(
                {
                    "title": title,
                    "description": project_bullets,
                    "tech_stack": _dedupe_list([str(item).strip() for item in (project.get("technologies") or []) if str(item).strip()]),
                }
            )
        recovered = _dedupe_dicts(output, ("title",))
        if recovered:
            return recovered

    recovered_projects = _recover_projects_from_blocks(blocks, skills, candidate_name=candidate_name)
    if recovered_projects:
        return recovered_projects

    fallback = _recover_projects_from_raw_text(raw_text, skills, candidate_name=candidate_name)
    if fallback:
        return fallback

    return []


def _parse_simple_list(blocks: list[str]) -> list[str]:
    items: list[str] = []
    seen = set()
    for block in blocks:
        current = ""
        for line in _clean_lines(block):
            normalized = line.strip()
            key = normalized.lower()
            if not normalized:
                continue
            if current and (_looks_like_continuation(normalized) or not _looks_like_new_item(normalized)):
                current = f"{current} {normalized}".strip()
                continue
            if current:
                current_key = current.lower()
                if current_key not in seen:
                    seen.add(current_key)
                    items.append(current)
            current = normalized
        if current:
            current_key = current.lower()
            if current_key not in seen:
                seen.add(current_key)
                items.append(current)
    return items


def _split_certifications_and_achievements(cert_blocks: list[str], achievement_blocks: list[str]) -> dict[str, list[str]]:
    certification_keywords = {"course", "courses", "program", "programs", "certification", "certifications", "training", "module", "modules", "curriculum", "workshop"}
    achievement_keywords = {"hackathon", "competition", "competed", "participated", "ranking", "ranked", "event", "events", "winner", "finalist"}

    certifications = _parse_simple_list(cert_blocks)
    achievements = _parse_simple_list(achievement_blocks)

    split_certifications: list[str] = []
    split_achievements: list[str] = []

    for item in certifications:
        cleaned = re.sub(r"(?i)^and activities\s*", "", item).strip()
        lowered = cleaned.lower()
        if any(keyword in lowered for keyword in achievement_keywords):
            split_achievements.append(cleaned)
        elif any(keyword in lowered for keyword in certification_keywords):
            split_certifications.append(cleaned)
        else:
            split_certifications.append(cleaned)

    for item in achievements:
        lowered = item.lower()
        if any(keyword in lowered for keyword in certification_keywords) and not any(keyword in lowered for keyword in achievement_keywords):
            split_certifications.append(item)
        else:
            split_achievements.append(item)

    return {
        "certifications": _dedupe_list(split_certifications),
        "achievements": _dedupe_list(split_achievements),
    }


def _recover_projects_from_blocks(blocks: list[str], skills: list[str], *, candidate_name: str) -> list[dict]:
    entries: list[dict] = []
    for block in blocks:
        for chunk in _split_blocks(block):
            lines = [line for line in _clean_lines(chunk) if not _looks_like_noise_sentence(line)]
            if not lines:
                continue
            title = _select_project_title(lines, candidate_name=candidate_name)
            if not title:
                title = _infer_project_title(" ".join(lines), skills)
            bullets = _recover_project_bullets("\n".join(lines), skills)
            if not title or len(bullets) < 2:
                continue
            tech_stack = _extract_tech_stack(" ".join(lines), skills)
            entries.append(
                {
                    "title": title,
                    "description": bullets,
                    "tech_stack": tech_stack,
                }
            )
    return _dedupe_dicts(entries, ("title",))


def _recover_projects_from_raw_text(raw_text: str, skills: list[str], *, candidate_name: str) -> list[dict]:
    cleaned_lines = [
        _normalize_sentence(line)
        for line in str(raw_text or "").splitlines()
        if _normalize_sentence(line)
    ]
    project_lines = [line for line in cleaned_lines if _looks_like_project_line(line) and not _looks_like_noise_sentence(line)]
    if len(project_lines) < 2:
        return []

    title = _select_project_title(project_lines, candidate_name=candidate_name) or _infer_project_title(" ".join(project_lines), skills)
    bullets = _recover_project_bullets("\n".join(project_lines), skills)
    if not title or len(bullets) < 2:
        return []

    return [
        {
            "title": title,
            "description": bullets,
            "tech_stack": _extract_tech_stack(" ".join(project_lines), skills),
        }
    ]


def _build_extra_sections(mapped_sections: dict[str, list[str]]) -> list[dict]:
    extras = []
    standard = {"summary", "skills", "education", "experience", "projects", "certifications", "achievements"}
    for key, blocks in mapped_sections.items():
        if key in standard:
            continue
        text = "\n\n".join(blocks).strip()
        if not text:
            continue
        extras.append({"name": key.title(), "content": text})
    return extras


def _build_section_mapping(structured_sections: list[dict], sections: dict) -> list[dict]:
    output: list[dict] = []
    for item in structured_sections:
        source = str(item.get("title") or item.get("key") or "").strip()
        if not source:
            continue
        target = _canonical_section_name(source)
        output.append(
            {
                "source": source,
                "target": target,
                "confidence": 0.95 if _canonical_section_name(source) != "other" else 0.55,
            }
        )

    for key, value in sections.items():
        if not str(value or "").strip():
            continue
        source = str(key).strip()
        if any(entry["source"].lower() == source.lower() for entry in output):
            continue
        target = _canonical_section_name(source)
        output.append(
            {
                "source": source,
                "target": target,
                "confidence": 0.9 if target != "other" else 0.5,
            }
        )
    return output


def _split_blocks(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\n\s*\n", str(text or "")) if part.strip()]


def _clean_lines(text: str) -> list[str]:
    return [
        re.sub(r"^[\-\*\u2022\t ]+", "", line).strip()
        for line in str(text or "").splitlines()
        if line and line.strip() and not _looks_like_contact_line(line)
    ]


def _extract_year_range(text: str) -> str:
    matches = re.findall(r"(?:19|20)\d{2}", text)
    if not matches:
        return ""
    if len(matches) == 1:
        return matches[0]
    years = sorted(int(value) for value in matches)
    if years[0] == years[-1]:
        return str(years[0])
    return f"{years[0]} - {years[-1]}"


def _extract_duration(text: str) -> str:
    month_pattern = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}"
    range_match = re.search(rf"(?i)({month_pattern}|\b(?:19|20)\d{{2}}\b)\s*[-–to]+\s*(present|current|{month_pattern}|\b(?:19|20)\d{{2}}\b)", text)
    if range_match:
        return range_match.group(0).strip()
    return _extract_year_range(text)


def _split_role_company(header: str) -> tuple[str, str]:
    parts = [part.strip() for part in re.split(r"\s+[|@-]\s+| at ", header, maxsplit=1, flags=re.IGNORECASE) if part.strip()]
    if len(parts) >= 2:
        return parts[0], parts[1]
    return header.strip(), ""


def _to_bullets(lines: list[str]) -> list[str]:
    bullets = []
    for line in lines:
        for part in re.split(r"(?<=[.;])\s+(?=[A-Z])|\n+", str(line or "").strip()):
            value = _normalize_sentence(part.strip(" -\t"))
            if value:
                bullets.append(_ensure_action_led(_truncate_words(value, 20)))
    return _dedupe_list([item for item in bullets if len(item.split()) >= 3])


def _dedupe_dicts(items: list[dict], keys: tuple[str, ...]) -> list[dict]:
    seen = set()
    output = []
    for item in items:
        marker = tuple(str(item.get(key, "")).strip().lower() for key in keys)
        if marker in seen or not any(marker):
            continue
        seen.add(marker)
        output.append(item)
    return output


def _dedupe_list(items: list[str]) -> list[str]:
    seen = set()
    output = []
    for item in items:
        key = str(item or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        output.append(str(item).strip())
    return output


def _limit_bullets(items: list[str], *, max_items: int) -> list[str]:
    return _dedupe_list(items)[:max_items]


def _infer_skills_from_entries(projects: list[dict], experience: list[dict]) -> list[str]:
    pool = " ".join(
        [
            " ".join(project.get("tech_stack", [])) + " " + " ".join(project.get("description", []))
            for project in projects
        ]
        + [
            " ".join(item.get("description", []))
            for item in experience
        ]
    ).lower()
    known = []
    for skill in ("Python", "Java", "JavaScript", "React", "Spring Boot", "Flask", "REST APIs", "MySQL", "MongoDB", "HTML", "CSS"):
        if skill.lower() in pool:
            known.append(skill)
    return known


def _infer_summary(skills: list[str], experience: list[dict], projects: list[dict], parsed_data: dict) -> str:
    role = ""
    if experience:
        role = experience[0].get("role", "")
    elif projects:
        role = "software developer"
    name = str(parsed_data.get("name", "")).strip()
    skill_text = ", ".join(skills[:5])
    summary_parts = []
    if role:
        summary_parts.append(f"{role.title()} with hands-on experience in {skill_text}." if skill_text else f"{role.title()} with practical project experience.")
    elif skill_text:
        summary_parts.append(f"Computer science candidate with practical experience in {skill_text}.")
    if projects:
        summary_parts.append(f"Built {len(projects)} structured project{'s' if len(projects) != 1 else ''} with implementation-focused, ATS-friendly resume content.")
    if name and not summary_parts:
        summary_parts.append(f"{name} brings structured technical skills and project-focused experience.")
    return " ".join(summary_parts[:2]).strip()


def _clean_summary(text: str) -> str:
    cleaned = _normalize_sentence(text)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return _truncate_words(cleaned, 45)


def _normalize_sentence(text: str) -> str:
    cleaned = str(text or "").replace("â€¢", " ").replace("•", " ").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+([,.;:])", r"\1", cleaned)
    return cleaned.strip(" -")


def _truncate_words(text: str, limit: int) -> str:
    words = str(text or "").split()
    if len(words) <= limit:
        return " ".join(words)
    return " ".join(words[:limit]).rstrip(",.;:") + "..."


def _ensure_action_led(text: str) -> str:
    value = str(text or "").strip()
    if not value:
        return ""
    first = value.split()[0].lower()
    action_words = {
        "built", "developed", "designed", "implemented", "created", "optimized",
        "integrated", "refactored", "automated", "led", "improved", "deployed",
        "analyzed", "engineered", "tested",
    }
    if first in action_words:
        return value[0].upper() + value[1:]
    return f"Implemented {value[0].lower() + value[1:]}" if value else value


def _looks_like_contact_line(text: str) -> bool:
    lowered = str(text or "").lower()
    return any(token in lowered for token in ("@", "linkedin.com", "github.com", "+91", "+1", "hyderabad", "india"))


def _looks_like_noise_title(text: str, *, candidate_name: str) -> bool:
    lowered = str(text or "").strip().lower()
    if not lowered:
        return True
    if _looks_like_contact_line(lowered):
        return True
    if candidate_name and lowered == candidate_name.strip().lower():
        return True
    if re.fullmatch(r"[A-Z\s]{6,}", str(text or "").strip()) and len(lowered.split()) <= 3:
        return True
    return any(token in lowered for token in ("professional summary", "education", "skills", "experience", "certifications"))


def _looks_like_noise_sentence(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    if not lowered:
        return True
    if _looks_like_contact_line(lowered):
        return True
    noise_tokens = (
        "professional summary", "education", "skills", "certifications", "activities",
        "seeking a software developer", "seeking a backend developer", "college of engineering",
        "cgpa", "intermediate", "junior college",
    )
    return any(token in lowered for token in noise_tokens)


def _looks_like_project_line(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    project_tokens = (
        "built", "developed", "designed", "implemented", "created", "integrated", "deployed",
        "application", "system", "website", "app", "project", "platform", "dashboard", "api",
    )
    return any(token in lowered for token in project_tokens)


def _select_project_title(lines: list[str], *, candidate_name: str) -> str:
    for line in lines[:4]:
        candidate = _normalize_sentence(line)
        if _looks_like_noise_title(candidate, candidate_name=candidate_name):
            continue
        if _looks_like_project_line(candidate) and len(candidate.split()) > 5:
            continue
        if len(candidate.split()) <= 8:
            return candidate.title() if candidate.islower() else candidate
    return ""


def _infer_project_title(text: str, skills: list[str]) -> str:
    lowered = str(text or "").lower()
    if "bank" in lowered:
        return "Banking Application Project"
    if "visualization" in lowered or "dashboard" in lowered:
        return "Data Visualization Project"
    if "web" in lowered or "website" in lowered or "app" in lowered:
        return "Web Application Project"
    if _extract_tech_stack(text, skills):
        return "Software Development Project"
    return ""


def _recover_project_bullets(text: str, skills: list[str]) -> list[str]:
    lines = [
        _normalize_sentence(line)
        for line in re.split(r"\n|(?<=[.;])\s+(?=[A-Z])", str(text or ""))
    ]
    bullets = []
    for line in lines:
        if not line or _looks_like_noise_sentence(line) or _looks_like_contact_line(line):
            continue
        if not _looks_like_project_line(line) and not _extract_tech_stack(line, skills):
            continue
        bullets.append(_ensure_action_led(_truncate_words(line, 20)))
    bullets = _dedupe_list([item for item in bullets if len(item.split()) >= 3])
    if len(bullets) >= 2:
        return bullets[:5]
    return []


def _extract_tech_stack(text: str, skills: list[str]) -> list[str]:
    lowered = str(text or "").lower()
    detected = [skill for skill in skills if skill.lower() in lowered]
    if detected:
        return _dedupe_list(detected)
    fallback_catalog = [
        "Java", "Spring Boot", "Flask", "React", "MySQL", "MongoDB", "REST APIs", "HTML", "CSS", "JavaScript", "Python",
    ]
    return _dedupe_list([skill for skill in fallback_catalog if skill.lower() in lowered])


def _looks_like_continuation(text: str) -> bool:
    stripped = str(text or "").strip()
    if not stripped:
        return False
    return stripped[:1].islower() or len(stripped.split()) <= 3


def _looks_like_new_item(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    start_tokens = (
        "completed", "competed", "participated", "won", "secured", "earned", "certified", "finished"
    )
    return any(lowered.startswith(token) for token in start_tokens)
