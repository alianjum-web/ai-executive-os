from app.services.citation_parser import parse_knowledge_answer, strip_metadata_block


def test_strip_metadata_block():
    raw = (
        "Revenue grew [Source: a.pdf, Page: 2].\n\n"
        "```json-metadata\n"
        '{"citations": [{"id": 1, "document_name": "a.pdf", "page_number": 2, '
        '"chunk_id": "abc", "exact_quote_highlight": "Revenue grew"}]}\n'
        "```"
    )
    clean, meta = strip_metadata_block(raw)
    assert "json-metadata" not in clean
    assert meta is not None
    assert len(meta["citations"]) == 1


def test_parse_knowledge_answer_merges_chunks():
    chunks = [
        {
            "chunk_id": "abc",
            "document_id": "doc-1",
            "document_name": "a.pdf",
            "page_number": 2,
            "content": "Revenue grew sharply in Q3.",
        }
    ]
    raw = (
        "Summary [Source: a.pdf, Page: 2].\n\n"
        "```json-metadata\n"
        '{"citations": [{"id": 1, "document_name": "a.pdf", "page_number": 2, '
        '"chunk_id": "abc", "exact_quote_highlight": "Revenue grew sharply"}]}\n'
        "```"
    )
    answer, citations = parse_knowledge_answer(raw, chunks)
    assert "json-metadata" not in answer
    assert citations[0]["document_name"] == "a.pdf"
    assert citations[0]["exact_quote_highlight"] == "Revenue grew sharply"
