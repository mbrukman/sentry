from __future__ import absolute_import

from enum import Enum


class AssistantManager(object):
    def __init__(self):
        self._guides = []

    def add(self, guide):
        if isinstance(guide, Enum):
            self._guides.append(guide)

    def get_valid_ids(self):
        return [guide.value for guide in self._guides]

    def all(self):
        return self._guides
