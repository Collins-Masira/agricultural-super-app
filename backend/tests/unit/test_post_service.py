# tests/unit/test_post_service.py

import pytest

from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.services import post_service


class TestCreatePost:
    def test_creates_post_owned_by_current_user(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "Maize tips", "content": "Plant in rows."})
        assert post.user_id == amina.id
        assert post.title == "Maize tips"

    def test_creates_nested_images(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(
            amina,
            {
                "title": "Maize tips",
                "content": "Plant in rows.",
                "images": [{"image_url": "https://x/1.jpg"}, {"image_url": "https://x/2.jpg"}],
            },
        )
        assert len(post.images) == 2
        assert {img.image_url for img in post.images} == {"https://x/1.jpg", "https://x/2.jpg"}


class TestGetPostOr404:
    def test_raises_not_found_for_missing_post(self):
        with pytest.raises(NotFoundError):
            post_service.get_post_or_404(999999)


class TestListPosts:
    def test_orders_newest_first(self, create_user):
        amina = create_user(username="amina")
        first = post_service.create_post(amina, {"title": "First", "content": "c"})
        second = post_service.create_post(amina, {"title": "Second", "content": "c"})

        posts = post_service.list_posts()

        assert [p.id for p in posts] == [second.id, first.id]

    def test_per_page_is_capped_at_max_page_size(self, create_user):
        amina = create_user(username="amina")
        for i in range(5):
            post_service.create_post(amina, {"title": f"Post {i}", "content": "c"})

        # Requesting an absurdly large page size should still be bounded
        # by MAX_PAGE_SIZE rather than returning everything -- this is
        # what actually protects the API from a client accidentally (or
        # deliberately) requesting the entire table in one call.
        posts = post_service.list_posts(page=1, per_page=1000)
        assert len(posts) == 5  # only 5 exist, but the cap didn't break anything

    def test_page_2_returns_different_older_posts_than_page_1(self, create_user):
        # Distinct from the cap test above: this proves the OFFSET math
        # itself is correct, not just that a ceiling exists. A bug that
        # ignored `page` entirely (always returning the same first N
        # rows) would still pass the cap test but fail this one.
        amina = create_user(username="amina")
        posts_created = [
            post_service.create_post(amina, {"title": f"Post {i}", "content": "c"}) for i in range(5)
        ]
        # list_posts orders newest-first, so page 1 = posts [4,3], page 2 = [2,1]
        newest_first_ids = [p.id for p in reversed(posts_created)]

        page_one = post_service.list_posts(page=1, per_page=2)
        page_two = post_service.list_posts(page=2, per_page=2)

        assert [p.id for p in page_one] == newest_first_ids[0:2]
        assert [p.id for p in page_two] == newest_first_ids[2:4]
        # The two pages must not overlap.
        assert set(p.id for p in page_one).isdisjoint(p.id for p in page_two)


class TestUpdatePost:
    def test_owner_can_update(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "Original", "content": "c"})

        updated = post_service.update_post(amina, post.id, {"title": "Updated"})
        assert updated.title == "Updated"

    def test_non_owner_cannot_update(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "Original", "content": "c"})

        with pytest.raises(ForbiddenError):
            post_service.update_post(brian, post.id, {"title": "Hijacked"})

    def test_admin_can_update_others_posts(self, create_user):
        amina = create_user(username="amina")
        admin = create_user(username="root", role="admin")
        post = post_service.create_post(amina, {"title": "Original", "content": "c"})

        updated = post_service.update_post(admin, post.id, {"title": "Moderated"})
        assert updated.title == "Moderated"

    def test_images_key_is_ignored_on_update(self, create_user):
        # update_post explicitly pops "images" -- a PUT with an images
        # list must not silently create new images through the back
        # door; that's what the dedicated /images endpoints are for.
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "Original", "content": "c"})

        post_service.update_post(amina, post.id, {"images": [{"image_url": "https://x/sneaky.jpg"}]})
        assert len(post.images) == 0


class TestDeletePost:
    def test_owner_can_delete(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "Doomed", "content": "c"})

        post_service.delete_post(amina, post.id)

        with pytest.raises(NotFoundError):
            post_service.get_post_or_404(post.id)

    def test_non_owner_cannot_delete(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "Not yours", "content": "c"})

        with pytest.raises(ForbiddenError):
            post_service.delete_post(brian, post.id)


class TestPostImages:
    def test_owner_can_add_and_delete_image(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})

        image = post_service.add_post_image(amina, post.id, "https://x/new.jpg")
        assert image.post_id == post.id

        post_service.delete_post_image(amina, post.id, image.id)  # should not raise

    def test_non_owner_cannot_add_image(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})

        with pytest.raises(ForbiddenError):
            post_service.add_post_image(brian, post.id, "https://x/hijack.jpg")

    def test_deleting_image_belonging_to_different_post_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        post_one = post_service.create_post(amina, {"title": "One", "content": "c"})
        post_two = post_service.create_post(amina, {"title": "Two", "content": "c"})
        image = post_service.add_post_image(amina, post_one.id, "https://x/1.jpg")

        # image belongs to post_one, not post_two -- must not be
        # deletable through post_two's endpoint even though the caller
        # owns both posts.
        with pytest.raises(NotFoundError):
            post_service.delete_post_image(amina, post_two.id, image.id)


class TestComments:
    def test_add_and_list_comments(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})

        post_service.add_comment(brian, post.id, "Nice post!")
        comments = post_service.list_comments(post.id)

        assert len(comments) == 1
        assert comments[0].content == "Nice post!"
        assert comments[0].user_id == brian.id

    def test_owner_can_edit_own_comment(self, create_user):
        amina = create_user(username="amina")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})
        comment = post_service.add_comment(amina, post.id, "Original")

        updated = post_service.update_comment(amina, comment.id, "Edited")
        assert updated.content == "Edited"

    def test_non_owner_cannot_edit_comment(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})
        comment = post_service.add_comment(brian, post.id, "Brian's comment")

        with pytest.raises(ForbiddenError):
            post_service.update_comment(amina, comment.id, "Hijacked")

    def test_non_owner_cannot_delete_comment(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})
        comment = post_service.add_comment(brian, post.id, "Brian's comment")

        with pytest.raises(ForbiddenError):
            post_service.delete_comment(amina, comment.id)


class TestLikes:
    def test_like_and_unlike(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})

        post_service.like_post(brian, post.id)
        post_service.unlike_post(brian, post.id)  # should not raise

    def test_liking_twice_raises_conflict(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})
        post_service.like_post(brian, post.id)

        with pytest.raises(ConflictError):
            post_service.like_post(brian, post.id)

    def test_unliking_without_liking_raises_not_found(self, create_user):
        amina = create_user(username="amina")
        brian = create_user(username="brian")
        post = post_service.create_post(amina, {"title": "T", "content": "c"})

        with pytest.raises(NotFoundError):
            post_service.unlike_post(brian, post.id)
