from app.services import post_service


class TestListAndCreatePosts:
    def test_list_posts_does_not_require_auth(self, client):
        response = client.get("/api/posts")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_create_post_requires_auth(self, client):
        response = client.post("/api/posts", json={"title": "T", "content": "C"})
        assert response.status_code == 401

    def test_create_post_success(self, client, amina):
        response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={
                "title": "Maize planting tips",
                "content": "Plant in rows 75cm apart.",
                "images": [{"image_url": "https://example.com/maize.jpg"}],
            },
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["author"]["username"] == "amina"
        assert body["images"][0]["image_url"].endswith("maize.jpg")

    def test_create_post_missing_content_returns_422(self, client, amina):
        response = client.post("/api/posts", headers=amina["headers"], json={"title": "T"})
        assert response.status_code == 422

    def test_list_reflects_created_posts_newest_first(self, client, amina):
        client.post("/api/posts", headers=amina["headers"], json={"title": "First", "content": "c"})
        client.post("/api/posts", headers=amina["headers"], json={"title": "Second", "content": "c"})

        response = client.get("/api/posts")
        titles = [p["title"] for p in response.get_json()]
        assert titles == ["Second", "First"]


class TestGetUpdateDeletePost:
    def _create_post(self, client, headers, title="Original"):
        response = client.post("/api/posts", headers=headers, json={"title": title, "content": "c"})
        return response.get_json()["id"]

    def test_get_post_returns_full_detail(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.get(f"/api/posts/{post_id}")
        assert response.status_code == 200
        assert response.get_json()["title"] == "Original"

    def test_get_unknown_post_returns_404(self, client):
        response = client.get("/api/posts/999999")
        assert response.status_code == 404

    def test_owner_can_update(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", headers=amina["headers"], json={"title": "Updated"})
        assert response.status_code == 200
        assert response.get_json()["title"] == "Updated"

    def test_non_owner_update_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", headers=brian["headers"], json={"title": "Hijacked"})
        assert response.status_code == 403

    def test_update_without_auth_returns_401(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.put(f"/api/posts/{post_id}", json={"title": "No auth"})
        assert response.status_code == 401

    def test_owner_can_delete(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}", headers=amina["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/posts/{post_id}").status_code == 404

    def test_non_owner_delete_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}", headers=brian["headers"])
        assert response.status_code == 403

    def test_delete_without_auth_returns_401(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}")
        assert response.status_code == 401

    def test_delete_unknown_post_returns_404(self, client, amina):
        response = client.delete("/api/posts/999999", headers=amina["headers"])
        assert response.status_code == 404

    def test_community_admin_can_delete_a_members_post(self, client, amina, brian):
        community_id = client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"}
        ).get_json()["id"]
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        post_id = client.post(
            "/api/posts",
            headers=brian["headers"],
            json={"title": "T", "content": "c", "community_id": community_id},
        ).get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}", headers=amina["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/posts/{post_id}").status_code == 404

    def test_community_admin_cannot_delete_unrelated_general_feed_post(self, client, amina, brian):
        client.post("/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"})
        post_id = self._create_post(client, brian["headers"])

        response = client.delete(f"/api/posts/{post_id}", headers=amina["headers"])
        assert response.status_code == 403

    def test_non_admin_member_cannot_delete_anothers_community_post(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        community_id = client.post(
            "/api/communities", headers=amina["headers"], json={"name": "Maize Farmers"}
        ).get_json()["id"]
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=eve["headers"])
        post_id = client.post(
            "/api/posts",
            headers=brian["headers"],
            json={"title": "T", "content": "c", "community_id": community_id},
        ).get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}", headers=eve["headers"])
        assert response.status_code == 403

    def test_deleting_a_repost_does_not_delete_the_original(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        repost_id = client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={}).get_json()["id"]

        response = client.delete(f"/api/posts/{repost_id}", headers=brian["headers"])
        assert response.status_code == 204
        assert client.get(f"/api/posts/{post_id}").status_code == 200


class TestPostImages:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_owner_can_add_image(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/images", headers=amina["headers"], json={"image_url": "https://x/new.jpg"}
        )
        assert response.status_code == 201

    def test_missing_image_url_returns_422(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/images", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_non_owner_cannot_add_image(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/images", headers=brian["headers"], json={"image_url": "https://x/hijack.jpg"}
        )
        assert response.status_code == 403

    def test_owner_can_delete_image(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        add_response = client.post(
            f"/api/posts/{post_id}/images", headers=amina["headers"], json={"image_url": "https://x/new.jpg"}
        )
        image_id = add_response.get_json()["id"]

        response = client.delete(f"/api/posts/{post_id}/images/{image_id}", headers=amina["headers"])
        assert response.status_code == 204


class TestComments:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_add_comment_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/comments", json={"content": "Nice!"})
        assert response.status_code == 401

    def test_add_and_list_comments(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        add_response = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Great tips!"}
        )
        assert add_response.status_code == 201
        assert add_response.get_json()["author"]["username"] == "brian"

        list_response = client.get(f"/api/posts/{post_id}/comments")
        assert list_response.status_code == 200
        assert len(list_response.get_json()) == 1

    def test_missing_content_returns_422(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/comments", headers=amina["headers"], json={})
        assert response.status_code == 422

    def test_owner_can_edit_own_comment(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=brian["headers"], json={"content": "Edited"})
        assert response.status_code == 200
        assert response.get_json()["content"] == "Edited"

    def test_non_owner_edit_returns_403(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=amina["headers"], json={"content": "Hijacked"})
        assert response.status_code == 403

    def test_owner_can_delete_own_comment(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.delete(f"/api/comments/{comment_id}", headers=brian["headers"])
        assert response.status_code == 204

    def test_updating_comment_with_missing_content_returns_422(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        comment_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.put(f"/api/comments/{comment_id}", headers=brian["headers"], json={})
        assert response.status_code == 422

    def test_updating_unknown_comment_returns_404(self, client, amina):
        response = client.put("/api/comments/999999", headers=amina["headers"], json={"content": "x"})
        assert response.status_code == 404

    def test_deleting_unknown_comment_returns_404(self, client, amina):
        response = client.delete("/api/comments/999999", headers=amina["headers"])
        assert response.status_code == 404

    def test_reply_to_comment_sets_parent_comment_id(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        parent_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        reply_response = client.post(
            f"/api/posts/{post_id}/comments",
            headers=amina["headers"],
            json={"content": "Thanks!", "parent_comment_id": parent_id},
        )
        assert reply_response.status_code == 201
        assert reply_response.get_json()["parent_comment_id"] == parent_id

    def test_reply_notifies_parent_comment_author_not_post_author(self, client, amina, brian, register_user):
        carol = register_user(username="carol")
        post_id = self._create_post(client, amina["headers"])
        parent_id = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        client.post(
            f"/api/posts/{post_id}/comments",
            headers=carol["headers"],
            json={"content": "Thanks!", "parent_comment_id": parent_id},
        )

        brian_notifications = client.get("/api/notifications", headers=brian["headers"]).get_json()
        assert any(n["type"] == "comment_reply" for n in brian_notifications)

        amina_notifications = client.get("/api/notifications", headers=amina["headers"]).get_json()
        assert not any(n["type"] == "comment_reply" for n in amina_notifications)

    def test_reply_to_comment_on_a_different_post_returns_404(self, client, amina, brian):
        post_one = self._create_post(client, amina["headers"])
        post_two = self._create_post(client, amina["headers"])
        parent_id = client.post(
            f"/api/posts/{post_one}/comments", headers=brian["headers"], json={"content": "Original"}
        ).get_json()["id"]

        response = client.post(
            f"/api/posts/{post_two}/comments",
            headers=amina["headers"],
            json={"content": "Wrong post", "parent_comment_id": parent_id},
        )
        assert response.status_code == 404


class TestLikes:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_like_and_unlike(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        like_response = client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert like_response.status_code == 201

        unlike_response = client.delete(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert unlike_response.status_code == 204

    def test_liking_twice_returns_409(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        response = client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert response.status_code == 409

    def test_unliking_without_liking_returns_404(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert response.status_code == 404

    def test_like_count_and_liked_by_me_on_get_post(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        before = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert before["like_count"] == 0
        assert before["liked_by_me"] is False

        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        after_brian = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert after_brian["like_count"] == 1
        assert after_brian["liked_by_me"] is True

        after_amina = client.get(f"/api/posts/{post_id}", headers=amina["headers"]).get_json()
        assert after_amina["like_count"] == 1
        assert after_amina["liked_by_me"] is False

        after_anonymous = client.get(f"/api/posts/{post_id}").get_json()
        assert after_anonymous["like_count"] == 1
        assert after_anonymous["liked_by_me"] is False

    def test_like_count_on_list_posts(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])

        listing = client.get("/api/posts", headers=brian["headers"]).get_json()
        post = next(p for p in listing if p["id"] == post_id)
        assert post["like_count"] == 1
        assert post["liked_by_me"] is True


class TestReactions:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_add_reaction_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/reactions", json={"reaction_type": "love"})
        assert response.status_code == 401

    def test_add_reaction_success(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "love"}
        )
        assert response.status_code == 201
        assert response.get_json()["reaction_type"] == "love"

    def test_changing_reaction_does_not_duplicate(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "like"})
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "fire"})

        detail = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert detail["my_reaction"] == "fire"
        assert detail["reaction_counts"] == {"fire": 1}

    def test_invalid_reaction_type_returns_422(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "angry"}
        )
        assert response.status_code == 422

    def test_missing_reaction_type_returns_422(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={})
        assert response.status_code == 422

    def test_remove_reaction(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/reactions", headers=brian["headers"], json={"reaction_type": "wow"})

        response = client.delete(f"/api/posts/{post_id}/reactions", headers=brian["headers"])
        assert response.status_code == 204

        detail = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert detail["my_reaction"] is None
        assert detail["reaction_counts"] == {}

    def test_removing_without_reacting_returns_404(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/reactions", headers=brian["headers"])
        assert response.status_code == 404

    def test_legacy_like_endpoint_still_works_alongside_reactions(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/like", headers=brian["headers"])
        assert response.status_code == 201

        detail = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert detail["like_count"] == 1
        assert detail["reaction_counts"] == {"like": 1}


class TestSaves:
    def _create_post(self, client, headers):
        response = client.post("/api/posts", headers=headers, json={"title": "T", "content": "c"})
        return response.get_json()["id"]

    def test_save_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/save")
        assert response.status_code == 401

    def test_save_and_unsave(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        save_response = client.post(f"/api/posts/{post_id}/save", headers=brian["headers"])
        assert save_response.status_code == 201

        detail = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert detail["saved_by_me"] is True
        assert detail["save_count"] == 1

        unsave_response = client.delete(f"/api/posts/{post_id}/save", headers=brian["headers"])
        assert unsave_response.status_code == 204

        detail_after = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert detail_after["saved_by_me"] is False
        assert detail_after["save_count"] == 0

    def test_saving_twice_returns_409(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/save", headers=brian["headers"])

        response = client.post(f"/api/posts/{post_id}/save", headers=brian["headers"])
        assert response.status_code == 409

    def test_unsaving_without_saving_returns_404(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/save", headers=brian["headers"])
        assert response.status_code == 404

    def test_saved_posts_are_user_specific(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/save", headers=brian["headers"])

        brian_saved = client.get("/api/posts/saved", headers=brian["headers"]).get_json()
        eve_saved = client.get("/api/posts/saved", headers=eve["headers"]).get_json()

        assert [p["id"] for p in brian_saved] == [post_id]
        assert eve_saved == []

    def test_listing_saved_posts_requires_auth(self, client):
        response = client.get("/api/posts/saved")
        assert response.status_code == 401


class TestReposts:
    def _create_post(self, client, headers, title="Pest control tips"):
        response = client.post("/api/posts", headers=headers, json={"title": title, "content": "Neem oil works."})
        return response.get_json()["id"]

    def test_repost_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/repost", json={})
        assert response.status_code == 401

    def test_repost_success(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(
            f"/api/posts/{post_id}/repost", headers=brian["headers"], json={"content": "Worth trying!"}
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body["author"]["username"] == "brian"
        assert body["content"] == "Worth trying!"
        assert body["original_post"]["id"] == post_id
        assert body["original_post"]["author"]["username"] == "amina"

    def test_repost_without_content_is_allowed(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})
        assert response.status_code == 201
        assert response.get_json()["content"] == ""

    def test_repost_appears_in_general_feed_with_attribution(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})

        feed = client.get("/api/posts").get_json()
        repost = next(p for p in feed if p["author"]["username"] == "brian")
        assert repost["original_post"]["author"]["username"] == "amina"

    def test_reposting_twice_returns_409(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})

        response = client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})
        assert response.status_code == 409

    def test_reposting_unknown_post_returns_404(self, client, amina):
        response = client.post("/api/posts/999999/repost", headers=amina["headers"], json={})
        assert response.status_code == 404

    def test_repost_count_reflects_on_original(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})

        detail = client.get(f"/api/posts/{post_id}").get_json()
        assert detail["repost_count"] == 1

    def test_reposted_by_me_toggles_and_persists(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])

        before = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert before["reposted_by_me"] is False

        client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})
        after_repost = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert after_repost["reposted_by_me"] is True
        assert after_repost["repost_count"] == 1

        unrepost_response = client.delete(f"/api/posts/{post_id}/repost", headers=brian["headers"])
        assert unrepost_response.status_code == 204

        after_unrepost = client.get(f"/api/posts/{post_id}", headers=brian["headers"]).get_json()
        assert after_unrepost["reposted_by_me"] is False
        assert after_unrepost["repost_count"] == 0

    def test_unrepost_requires_auth(self, client, amina):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/repost")
        assert response.status_code == 401

    def test_unreposting_without_reposting_returns_404(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        response = client.delete(f"/api/posts/{post_id}/repost", headers=brian["headers"])
        assert response.status_code == 404

    def test_repost_then_unrepost_then_repost_again(self, client, amina, brian):
        post_id = self._create_post(client, amina["headers"])
        client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})
        client.delete(f"/api/posts/{post_id}/repost", headers=brian["headers"])

        response = client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={})
        assert response.status_code == 201

    def test_repost_count_shows_correctly_from_a_reposted_cards_perspective(self, client, amina, brian, register_user):
        eve = register_user(username="eve")
        post_id = self._create_post(client, amina["headers"])
        repost = client.post(f"/api/posts/{post_id}/repost", headers=brian["headers"], json={}).get_json()

        eve_view_of_repost = client.get(f"/api/posts/{repost['id']}", headers=eve["headers"]).get_json()
        assert eve_view_of_repost["repost_count"] == 1
        assert eve_view_of_repost["reposted_by_me"] is False

        client.post(f"/api/posts/{repost['id']}/repost", headers=eve["headers"], json={})
        eve_view_after = client.get(f"/api/posts/{repost['id']}", headers=eve["headers"]).get_json()
        assert eve_view_after["repost_count"] == 2
        assert eve_view_after["reposted_by_me"] is True


class TestCommunityPosts:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_member_can_create_post_in_community(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "T", "content": "c", "community_id": community_id},
        )
        assert response.status_code == 201
        assert response.get_json()["community_id"] == community_id

    def test_non_member_cannot_create_post_in_community(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(
            "/api/posts",
            headers=brian["headers"],
            json={"title": "T", "content": "c", "community_id": community_id},
        )
        assert response.status_code == 403

    def test_posting_to_unknown_community_returns_404(self, client, amina):
        response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "T", "content": "c", "community_id": 999999},
        )
        assert response.status_code == 404

    def test_community_feed_lists_only_that_communitys_posts(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "In community", "content": "c", "community_id": community_id},
        )
        client.post("/api/posts", headers=amina["headers"], json={"title": "General", "content": "c"})

        response = client.get(f"/api/communities/{community_id}/posts")
        assert response.status_code == 200
        titles = [p["title"] for p in response.get_json()]
        assert titles == ["In community"]

    def test_general_feed_excludes_community_posts(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "In community", "content": "c", "community_id": community_id},
        )
        client.post("/api/posts", headers=amina["headers"], json={"title": "General", "content": "c"})

        response = client.get("/api/posts")
        titles = [p["title"] for p in response.get_json()]
        assert titles == ["General"]

    def test_community_feed_for_unknown_community_returns_404(self, client):
        response = client.get("/api/communities/999999/posts")
        assert response.status_code == 404

    def test_experts_only_posting_enforced_over_http(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"posting_permission": "experts_only"}
        )

        response = client.post(
            "/api/posts",
            headers=brian["headers"],
            json={"title": "T", "content": "c", "community_id": community_id},
        )
        assert response.status_code == 403


class TestAnnouncements:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def test_admin_can_post_announcement(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        response = client.post(
            "/api/posts",
            headers=amina["headers"],
            json={
                "title": "Workshop",
                "content": "9am tomorrow",
                "community_id": community_id,
                "is_announcement": True,
            },
        )
        assert response.status_code == 201
        assert response.get_json()["is_announcement"] is True

    def test_member_cannot_post_announcement(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])

        response = client.post(
            "/api/posts",
            headers=brian["headers"],
            json={"title": "Fake", "content": "c", "community_id": community_id, "is_announcement": True},
        )
        assert response.status_code == 403

    def test_announcement_appears_in_community_feed(self, client, amina):
        community_id = self._create_community(client, amina["headers"])
        client.post(
            "/api/posts",
            headers=amina["headers"],
            json={"title": "Workshop", "content": "9am", "community_id": community_id, "is_announcement": True},
        )

        feed = client.get(f"/api/communities/{community_id}/posts").get_json()
        assert feed[0]["is_announcement"] is True


class TestCommentModeration:
    def _create_community(self, client, headers, name="Maize Farmers"):
        response = client.post("/api/communities", headers=headers, json={"name": name})
        return response.get_json()["id"]

    def _create_community_post(self, client, headers, community_id):
        response = client.post(
            "/api/posts", headers=headers, json={"title": "T", "content": "c", "community_id": community_id}
        )
        return response.get_json()["id"]

    def test_comments_work_when_enabled(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        post_id = self._create_community_post(client, amina["headers"], community_id)

        response = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Nice!"}
        )
        assert response.status_code == 201

    def test_comments_fail_when_disabled(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        post_id = self._create_community_post(client, amina["headers"], community_id)
        client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"comments_enabled": False}
        )

        response = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Nice!"}
        )
        assert response.status_code == 403

    def test_post_is_still_visible_when_comments_are_closed(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        post_id = self._create_community_post(client, amina["headers"], community_id)
        client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"comments_enabled": False}
        )

        response = client.get(f"/api/posts/{post_id}", headers=brian["headers"])
        assert response.status_code == 200
        assert response.get_json()["comments_open"] is False

    def test_manually_forged_request_still_rejected_when_comments_disabled(self, client, amina, brian):
        community_id = self._create_community(client, amina["headers"])
        client.post(f"/api/communities/{community_id}/members", headers=brian["headers"])
        post_id = self._create_community_post(client, amina["headers"], community_id)
        client.put(
            f"/api/communities/{community_id}", headers=amina["headers"], json={"comments_enabled": False}
        )

        response = client.post(
            f"/api/posts/{post_id}/comments",
            headers=brian["headers"],
            json={"content": "I am bypassing the UI"},
        )
        assert response.status_code == 403
        assert post_service.get_post_or_404(post_id).comments == []

    def test_general_feed_comments_are_unaffected_by_community_settings(self, client, amina, brian):
        response = client.post("/api/posts", headers=amina["headers"], json={"title": "T", "content": "c"})
        post_id = response.get_json()["id"]

        comment_response = client.post(
            f"/api/posts/{post_id}/comments", headers=brian["headers"], json={"content": "Nice!"}
        )
        assert comment_response.status_code == 201


class TestReels:
    def _create_post(self, client, headers, video_url=None, title="T"):
        payload = {"title": title, "content": "c"}
        if video_url:
            payload["video_url"] = video_url
        response = client.post("/api/posts", headers=headers, json=payload)
        return response.get_json()

    def test_creating_a_post_with_video_url_marks_it_as_a_reel(self, client, amina):
        post = self._create_post(client, amina["headers"], video_url="http://x/clip.mp4")
        assert post["video_url"] == "http://x/clip.mp4"
        assert post["view_count"] == 0

    def test_regular_post_has_no_video_url(self, client, amina):
        post = self._create_post(client, amina["headers"])
        assert post["video_url"] is None

    def test_has_video_filter_returns_only_reels(self, client, amina):
        self._create_post(client, amina["headers"], title="A plain post")
        reel = self._create_post(client, amina["headers"], video_url="http://x/clip.mp4", title="A reel")

        response = client.get("/api/posts?has_video=true")
        assert response.status_code == 200
        titles = [p["title"] for p in response.get_json()]
        assert titles == ["A reel"]
        assert response.get_json()[0]["id"] == reel["id"]

    def test_default_listing_still_includes_reels(self, client, amina):
        self._create_post(client, amina["headers"], video_url="http://x/clip.mp4")
        response = client.get("/api/posts")
        assert len(response.get_json()) == 1

    def test_editing_a_reel_does_not_clear_its_video_url(self, client, amina):
        reel = self._create_post(client, amina["headers"], video_url="http://x/clip.mp4")
        response = client.put(
            f"/api/posts/{reel['id']}", headers=amina["headers"], json={"content": "Updated caption"}
        )
        assert response.status_code == 200
        assert response.get_json()["video_url"] == "http://x/clip.mp4"
        assert response.get_json()["content"] == "Updated caption"

    def test_view_count_increments_and_does_not_require_auth(self, client, amina):
        post = self._create_post(client, amina["headers"])
        response = client.post(f"/api/posts/{post['id']}/view")
        assert response.status_code == 200
        assert response.get_json()["view_count"] == 1

        client.post(f"/api/posts/{post['id']}/view")
        get_response = client.get(f"/api/posts/{post['id']}")
        assert get_response.get_json()["view_count"] == 2

    def test_view_count_on_unknown_post_returns_404(self, client):
        response = client.post("/api/posts/999999/view")
        assert response.status_code == 404

    def test_reel_can_be_liked_commented_saved_reposted_and_reported_like_any_post(
        self, client, amina, brian
    ):
        reel = self._create_post(client, amina["headers"], video_url="http://x/clip.mp4")

        assert client.post(f"/api/posts/{reel['id']}/like", headers=brian["headers"]).status_code == 201
        assert (
            client.post(
                f"/api/posts/{reel['id']}/comments", headers=brian["headers"], json={"content": "Nice!"}
            ).status_code
            == 201
        )
        assert client.post(f"/api/posts/{reel['id']}/save", headers=brian["headers"]).status_code == 201
        assert client.post(f"/api/posts/{reel['id']}/repost", headers=brian["headers"]).status_code == 201
        assert (
            client.post(
                f"/api/posts/{reel['id']}/report", headers=brian["headers"], json={"reason": "spam"}
            ).status_code
            == 201
        )
