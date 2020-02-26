from __future__ import absolute_import

from .manager import AssistantManager
from .guides import AssistantGuide

manager = AssistantManager()

manager.add(AssistantGuide.ISSUE_DETAIL)
manager.add(AssistantGuide.ISSUE_STREAM)
manager.add(AssistantGuide.DISCOVER_SIDEBAR)
