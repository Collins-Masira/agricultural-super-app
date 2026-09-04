"""add stories

Revision ID: e3f4a5b6c7d8
Revises: c4d5e6f7a8b9
Create Date: 2026-09-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3f4a5b6c7d8'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'stories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=False),
        sa.Column('caption', sa.String(length=120), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_stories_user_id', 'stories', ['user_id'])
    op.create_index('ix_stories_expires_at', 'stories', ['expires_at'])


def downgrade():
    op.drop_index('ix_stories_expires_at', table_name='stories')
    op.drop_index('ix_stories_user_id', table_name='stories')
    op.drop_table('stories')
