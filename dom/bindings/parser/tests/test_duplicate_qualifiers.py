def WebIDLTest(parser, harness):
    threw = False
    try:
        parser.parse(
            """
            interface DuplicateQualifiers1 {
              getter getter byte foo(unsigned long index);
            };
        """
        )

        parser.finish()
    except Exception:
        threw = True

    harness.ok(threw, "Should have thrown.")

    threw = False
    try:
        parser.parse(
            """
            interface DuplicateQualifiers2 {
              setter setter byte foo(unsigned long index, byte value);
            };
        """
        )

        parser.finish()
    except Exception:
        threw = True

    harness.ok(threw, "Should have thrown.")

    threw = False
    try:
        parser.parse(
            """
            interface DuplicateQualifiers4 {
              deleter deleter byte foo(unsigned long index);
            };
        """
        )

        parser.finish()
    except Exception:
        threw = True

    harness.ok(threw, "Should have thrown.")

    threw = False
    try:
        parser.parse(
            """
            interface DuplicateQualifiers5 {
              getter deleter getter byte foo(unsigned long index);
            };
        """
        )

        parser.finish()
    except Exception:
        threw = True

    harness.ok(threw, "Should have thrown.")
