from __future__ import absolute_import

from enum import Enum


class AssistantGuide(Enum):
    ISSUE_DETAIL = 1
    ISSUE_STREAM = 3
    DISCOVER_SIDEBAR = 4


ACTIVE_GUIDES = [
    AssistantGuide.ISSUE_DETAIL,
    AssistantGuide.ISSUE_STREAM,
    AssistantGuide.DISCOVER_SIDEBAR,
]
