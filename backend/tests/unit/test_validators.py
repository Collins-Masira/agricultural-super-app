# tests/unit/test_validators.py

import pytest

from app.validators import marshmallow_password_validator, password_requirement_failures


class TestPasswordRequirementFailures:
    def test_strong_password_has_no_failures(self):
        assert password_requirement_failures("Str0ng!Pass") == []

    def test_empty_password_fails_every_requirement(self):
        assert len(password_requirement_failures("")) == 5

    def test_none_is_treated_as_empty(self):
        assert password_requirement_failures(None) == password_requirement_failures("")

    @pytest.mark.parametrize(
        "password,missing_keyword",
        [
            ("lowercase123!", "uppercase"),
            ("UPPERCASE123!", "lowercase"),
            ("NoNumbersHere!", "number"),
            ("NoSpecialChar123", "special"),
            ("Sh0rt!", "characters"),
        ],
    )
    def test_flags_specific_missing_requirement(self, password, missing_keyword):
        failures = password_requirement_failures(password)
        assert any(missing_keyword in f.lower() for f in failures)

    def test_multiple_missing_requirements_are_all_reported(self):
        # "short" fails length, uppercase, number, and special-character.
        failures = password_requirement_failures("short")
        assert len(failures) == 4


class TestMarshmallowPasswordValidator:
    def test_raises_for_weak_password(self):
        from marshmallow import ValidationError

        with pytest.raises(ValidationError):
            marshmallow_password_validator("weak")

    def test_does_not_raise_for_strong_password(self):
        marshmallow_password_validator("Str0ng!Pass")  # should not raise
