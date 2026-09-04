"""add community roles, permissions, and post announcements

Revision ID: 9a7026b8f2f2
Revises: a086921fd1ec
Create Date: 2026-08-27 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '9a7026b8f2f2'
down_revision = 'a086921fd1ec'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('community_members', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('role', sa.String(length=20), nullable=False, server_default='member')
        )
        batch_op.create_check_constraint(
            'ck_community_members_role', "role IN ('member', 'admin')"
        )

    with op.batch_alter_table('communities', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('posting_permission', sa.String(length=20), nullable=False, server_default='everyone')
        )
        batch_op.add_column(
            sa.Column('messaging_permission', sa.String(length=20), nullable=False, server_default='everyone')
        )
        batch_op.add_column(
            sa.Column('comments_enabled', sa.Boolean(), nullable=False, server_default='1')
        )
        batch_op.create_check_constraint(
            'ck_communities_posting_permission',
            "posting_permission IN ('everyone', 'experts_only', 'admins_only')",
        )
        batch_op.create_check_constraint(
            'ck_communities_messaging_permission',
            "messaging_permission IN ('everyone', 'experts_only', 'admins_only')",
        )

    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('is_announcement', sa.Boolean(), nullable=False, server_default='0')
        )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            "UPDATE community_members SET role = 'admin' "
            "WHERE user_id IN (SELECT created_by FROM communities WHERE communities.id = community_members.community_id)"
        )
    )


def downgrade():
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_column('is_announcement')

    with op.batch_alter_table('communities', schema=None) as batch_op:
        batch_op.drop_constraint('ck_communities_messaging_permission', type_='check')
        batch_op.drop_constraint('ck_communities_posting_permission', type_='check')
        batch_op.drop_column('comments_enabled')
        batch_op.drop_column('messaging_permission')
        batch_op.drop_column('posting_permission')

    with op.batch_alter_table('community_members', schema=None) as batch_op:
        batch_op.drop_constraint('ck_community_members_role', type_='check')
        batch_op.drop_column('role')
