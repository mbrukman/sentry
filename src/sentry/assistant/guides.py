from __future__ import absolute_import

from enum import Enum


class AssistantGuide(Enum):
    ISSUE_DETAILS = 1
    ISSUE_STREAM = 3
    DISCOVER_SIDEBAR = 4


ACTIVE_GUIDES = [
    AssistantGuide.ISSUE_DETAILS,
    AssistantGuide.ISSUE_STREAM,
    AssistantGuide.DISCOVER_SIDEBAR,
]
