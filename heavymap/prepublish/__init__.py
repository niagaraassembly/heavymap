"""Pre-publish checks over a jurisdiction build output tree (NA-306 increment 1).

One command walks every output file and runs four fail-closed checks:

1. leak — withheld field names and seeded withheld values
2. allowlist — every emitted field is named for that output kind
3. size — accepted Hamilton budgets from BETA-GATE-HAMILTON.md section 6
4. reproducibility — SHA-256 (and ID/metric) comparison to a reference tree

This module does not publish or deploy. Real-data runs stay on Debian.
"""

from heavymap.prepublish.checks import CheckError, run_checks

__all__ = ["CheckError", "run_checks"]
