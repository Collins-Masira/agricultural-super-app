"""add community posts, reactions, saves, and reposts

Revision ID: a086921fd1ec
Revises: d9607e148d45
Create Date: 2026-08-27 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a086921fd1ec'
down_revision = 'd9607e148d45'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('community_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('original_post_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_posts_community_id_communities', 'communities', ['community_id'], ['id'], ondelete='CASCADE'
        )
        batch_op.create_foreign_key(
            'fk_posts_original_post_id_posts', 'posts', ['original_post_id'], ['id'], ondelete='CASCADE'
        )
        batch_op.create_unique_constraint('unique_user_repost', ['user_id', 'original_post_id'])

    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('reaction_type', sa.String(length=20), nullable=False, server_default='like')
        )
        batch_op.create_check_constraint(
            'ck_likes_reaction_type',
            "reaction_type IN ('like', 'love', 'funny', 'wow', 'sad', 'fire')",
        )

    op.create_table(
        'saved_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id', name='unique_user_saved_post'),
    )


def downgrade():
    op.drop_table('saved_posts')

    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.drop_constraint('ck_likes_reaction_type', type_='check')
        batch_op.drop_column('reaction_type')

    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_constraint('unique_user_repost', type_='unique')
        batch_op.drop_constraint('fk_posts_original_post_id_posts', type_='foreignkey')
        batch_op.drop_constraint('fk_posts_community_id_communities', type_='foreignkey')
        batch_op.drop_column('original_post_id')
        batch_op.drop_column('community_id')
