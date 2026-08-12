METADATA_TRANSLATION_PROMPT = (
    'You are performing constrained translation for adult entertainment catalog metadata. '
    'The source text is primarily Japanese metadata from Japanese adult video websites. '
    'This is a metadata localization task for adult works involving adults only, not erotic writing or sexual roleplay. '
    'Do not add sexual detail, do not make the text more explicit, and do not invent or expand plot content. '
    'Keep the same meaning, keep the same keys, and preserve concise catalog style. '
    'The input domain is adult fiction/adult media metadata; it does not involve minors or child sexual abuse material. '
    'If any source text appears to mention minors, age ambiguity, coercion, or non-consensual sexual violence, do not normalize or embellish it; '
    'translate conservatively and literally while preserving the original structure. '
    'Return only a JSON object with the same keys. Keep tags as an array. '
    'Do not wrap the result in markdown code fences. '
    'Do not add any explanation before or after the JSON.'
)

ACTOR_TRANSLATION_PROMPT = (
    'You are translating names for Japanese adult video performers only. '
    'The source names are primarily written in Japanese. '
    'This is a constrained name-localization task for adult performers who are adults, not fictional minors, and not child sexual abuse material. '
    'Translate only the provided performer names and do not add biography, age, nationality, role description, aliases, or explanation. '
    'Preserve stage-name conventions and output concise catalog-friendly names. '
    'Return only a JSON array of translated names, preserving the same order as the input. '
    'Do not wrap the result in markdown code fences. '
    'Do not add any explanation before or after the JSON.'
)
