from __future__ import absolute_import

import six

from django.utils import timezone

from sentry.assistant import manager
from sentry.assistant.guides import AssistantGuide
from sentry.models import AssistantActivity
from sentry.testutils import APITestCase


class AssistantActivityTest(APITestCase):
    endpoint = "sentry-api-0-assistant"

    def setUp(self):
        super(AssistantActivityTest, self).setUp()
        self.create_organization(owner=self.user)
        self.login_as(user=self.user)

    def test_simple(self):
        resp = self.get_response()
        assert resp.status_code == 200

        data = resp.data
        assert len(data) == len(manager.all())
        for key, value in six.iteritems(data):
            assert value["seen"] is False

    def test_dismissed(self):
        AssistantActivity.objects.create(
            user=self.user, guide_id=AssistantGuide.ISSUE_DETAIL.value, dismissed_ts=timezone.now()
        )
        resp = self.get_response()
        assert resp.status_code == 200
        assert resp.data[AssistantGuide.ISSUE_DETAIL.name.lower()]["seen"] is True

    def test_viewed(self):
        AssistantActivity.objects.create(
            user=self.user, guide_id=AssistantGuide.ISSUE_DETAIL.value, viewed_ts=timezone.now()
        )
        resp = self.get_response()
        assert resp.status_code == 200
        assert resp.data[AssistantGuide.ISSUE_DETAIL.name.lower()]["seen"] is True


class AssistantActivityUpdateTest(APITestCase):
    endpoint = "sentry-api-0-assistant"
    method = "put"

    def setUp(self):
        super(AssistantActivityUpdateTest, self).setUp()
        self.create_organization(owner=self.user)
        self.login_as(user=self.user)

    def test_invalid_inputs(self):
        resp = self.get_response(guide_id=1938)
        assert resp.status_code == 400

        resp = self.get_response(
            guide_id=AssistantGuide.ISSUE_DETAIL.value, status="whats_my_name_again"
        )
        assert resp.status_code == 400

    def test_dismissed(self):
        resp = self.get_response(guide_id=AssistantGuide.ISSUE_STREAM.value, status="dismissed")
        assert resp.status_code == 201

        activity = AssistantActivity.objects.get(
            user=self.user, guide_id=AssistantGuide.ISSUE_STREAM.value
        )
        assert activity.dismissed_ts
        assert not activity.viewed_ts

    def test_viewed(self):
        resp = self.get_response(guide_id=AssistantGuide.ISSUE_STREAM.value, status="viewed")
        assert resp.status_code == 201

        activity = AssistantActivity.objects.get(
            user=self.user, guide_id=AssistantGuide.ISSUE_STREAM.value
        )
        assert not activity.dismissed_ts
        assert activity.viewed_ts
