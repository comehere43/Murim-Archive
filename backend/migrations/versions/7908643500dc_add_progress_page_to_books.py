"""add progress page to books

Revision ID: 7908643500dc
Revises: 33b4cc4ae9bf
Create Date: 2026-09-02 09:21:50.721375

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "7908643500dc"
down_revision: Union[str, Sequence[str], None] = "33b4cc4ae9bf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "books",
        sa.Column(
            "progress_page",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )

    op.execute("""
        UPDATE books
        SET progress_page = max_read_page
        """)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "books",
        "progress_page",
    )
