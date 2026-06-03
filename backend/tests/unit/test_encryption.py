from app.core.encryption import decrypt_value, encrypt_value


def test_encrypt_decrypt_round_trip():
    plain = "jira-oauth-token-secret-12345"
    cipher = encrypt_value(plain)
    assert cipher != plain
    assert decrypt_value(cipher) == plain


def test_empty_values():
    assert encrypt_value("") == ""
    assert decrypt_value("") == ""
