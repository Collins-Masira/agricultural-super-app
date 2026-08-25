# app/services/post_service.py

from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.extensions import db
from app.models import Comment, Like, Post, PostImage

MAX_PAGE_SIZE = 100


def _assert_owner(current_user, owner_id, resource_name):
    """
    Shared authorization check: the caller must own the resource, or
    hold the "admin" role. "admin" is deliberately the only override --
    see user_schema.py for why it can never be self-assigned at
    registration.
    """
    if current_user.id != owner_id and current_user.role != "admin":
        raise ForbiddenError(f"You do not have permission to modify this {resource_name}.")


def get_post_or_404(post_id):
    post = db.session.get(Post, post_id)
    if post is None:
        raise NotFoundError(f"Post {post_id} not found.")
    return post


def list_posts(page=1, per_page=20):
    per_page = min(per_page, MAX_PAGE_SIZE)
    return (
        db.session.query(Post)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )


def create_post(current_user, data):
    """
    `data` comes from PostSchema.load() and may include a nested
    "images" list (only "image_url" survives loading -- see
    post_schema.py's PostImageSchema, whose id/post_id/created_at are
    dump_only and therefore stripped automatically).
    """
    images_data = data.pop("images", [])
    post = Post(user_id=current_user.id, **data)
    db.session.add(post)
    db.session.flush()  # assigns post.id before attaching child images

    for image in images_data:
        db.session.add(PostImage(post_id=post.id, image_url=image["image_url"]))

    db.session.commit()
    return post


def update_post(current_user, post_id, data):
    post = get_post_or_404(post_id)
    _assert_owner(current_user, post.user_id, "post")

    # Image management goes through dedicated /images endpoints, not a
    # blanket PUT -- silently accepting an "images" list here would make
    # it ambiguous whether it's additive or replaces the whole set.
    data.pop("images", None)

    for key, value in data.items():
        setattr(post, key, value)

    db.session.commit()
    return post


def delete_post(current_user, post_id):
    post = get_post_or_404(post_id)
    _assert_owner(current_user, post.user_id, "post")
    db.session.delete(post)
    db.session.commit()


def add_post_image(current_user, post_id, image_url):
    post = get_post_or_404(post_id)
    _assert_owner(current_user, post.user_id, "post")
    image = PostImage(post_id=post.id, image_url=image_url)
    db.session.add(image)
    db.session.commit()
    return image


def delete_post_image(current_user, post_id, image_id):
    post = get_post_or_404(post_id)
    _assert_owner(current_user, post.user_id, "post")

    image = db.session.get(PostImage, image_id)
    if image is None or image.post_id != post.id:
        raise NotFoundError(f"Image {image_id} not found on post {post_id}.")

    db.session.delete(image)
    db.session.commit()


def list_comments(post_id):
    get_post_or_404(post_id)  # 404 if the post itself doesn't exist
    return (
        db.session.query(Comment)
        .filter_by(post_id=post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


def add_comment(current_user, post_id, content):
    post = get_post_or_404(post_id)
    comment = Comment(user_id=current_user.id, post_id=post.id, content=content)
    db.session.add(comment)
    db.session.commit()
    return comment


def get_comment_or_404(comment_id):
    comment = db.session.get(Comment, comment_id)
    if comment is None:
        raise NotFoundError(f"Comment {comment_id} not found.")
    return comment


def update_comment(current_user, comment_id, content):
    comment = get_comment_or_404(comment_id)
    _assert_owner(current_user, comment.user_id, "comment")
    comment.content = content
    db.session.commit()
    return comment


def delete_comment(current_user, comment_id):
    comment = get_comment_or_404(comment_id)
    _assert_owner(current_user, comment.user_id, "comment")
    db.session.delete(comment)
    db.session.commit()


def like_post(current_user, post_id):
    post = get_post_or_404(post_id)
    existing = (
        db.session.query(Like)
        .filter_by(user_id=current_user.id, post_id=post.id)
        .first()
    )
    if existing:
        raise ConflictError("You already liked this post.")

    like = Like(user_id=current_user.id, post_id=post.id)
    db.session.add(like)
    db.session.commit()
    return like


def unlike_post(current_user, post_id):
    like = (
        db.session.query(Like)
        .filter_by(user_id=current_user.id, post_id=post_id)
        .first()
    )
    if like is None:
        raise NotFoundError("You have not liked this post.")
    db.session.delete(like)
    db.session.commit()
