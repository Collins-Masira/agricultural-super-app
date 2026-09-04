"""add reels (video posts) and comment replies

Revision ID: c4d5e6f7a8b9
Revises: f1a2b3c4d5e6
Create Date: 2026-09-01 09:46:29.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4d5e6f7a8b9'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('video_url', sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column('view_count', sa.Integer(), nullable=False, server_default='0')
        )
        batch_op.create_index('ix_posts_video_url', ['video_url'])

    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('parent_comment_id', sa.Integer(), nullable=True))
        batch_op.create_index('ix_comments_parent_comment_id', ['parent_comment_id'])
        batch_op.create_foreign_key(
            'fk_comments_parent_comment_id',
            'comments',
            ['parent_comment_id'], ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_constraint('ck_notifications_type', type_='check')
        batch_op.create_check_constraint(
            'ck_notifications_type',
            "type IN ('post_like', 'post_comment', 'follow', 'comment_reply')",
        )


def downgrade():
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_constraint('ck_notifications_type', type_='check')
        batch_op.create_check_constraint(
            'ck_notifications_type',
            "type IN ('post_like', 'post_comment', 'follow')",
        )

    with op.batch_alter_table('comments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_comments_parent_comment_id', type_='foreignkey')
        batch_op.drop_index('ix_comments_parent_comment_id')
        batch_op.drop_column('parent_comment_id')

    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_index('ix_posts_video_url')
        batch_op.drop_column('view_count')
        batch_op.drop_column('video_url')
