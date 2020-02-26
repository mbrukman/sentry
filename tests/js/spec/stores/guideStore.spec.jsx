import React from 'react';
import GuideStore from 'app/stores/guideStore';
import GuideAnchor from 'app/components/assistant/guideAnchor';
import ConfigStore from 'app/stores/configStore';

describe('GuideStore', function() {
  let data;

  beforeEach(function() {
    ConfigStore.config = {
      user: {
        isSuperuser: false,
        dateJoined: new Date(2020, 0, 1),
      },
    };

    GuideStore.init();
    data = {
      issue_detail: {
        id: 1,
        seen: false,
      },
      issue_stream: {id: 3, seen: true},
    };
    GuideStore.onRegisterAnchor(<GuideAnchor target="issue-title" />);
    GuideStore.onRegisterAnchor(<GuideAnchor target="exception" />);
    GuideStore.onRegisterAnchor(<GuideAnchor target="breadcrumbs" />);
    GuideStore.onRegisterAnchor(<GuideAnchor target="issue-stream" />);
  });

  afterEach(function() {});

  it('should move through the steps in the guide', function() {
    GuideStore.onFetchSucceeded(data);
    // Should pick the first non-seen guide in alphabetic order.
    expect(GuideStore.state.currentStep).toEqual(0);
    expect(GuideStore.state.currentGuide.id).toEqual(data.issue_detail.id);
    // Should prune steps that don't have anchors.
    expect(GuideStore.state.currentGuide.steps).toHaveLength(3);

    GuideStore.onNextStep();
    expect(GuideStore.state.currentStep).toEqual(1);
    GuideStore.onNextStep();
    expect(GuideStore.state.currentStep).toEqual(2);
    GuideStore.onCloseGuide();
    expect(GuideStore.state.currentGuide).toEqual(null);
  });

  it('should force show a guide with #assistant', function() {
    data = {
      issue_detail: {
        id: 1,
        seen: true,
      },
      issue_stream: {id: 3, seen: false},
    };

    GuideStore.onFetchSucceeded(data);
    window.location.hash = '#assistant';
    GuideStore.onURLChange();
    expect(GuideStore.state.currentGuide.id).toEqual(data.issue_detail.id);
    GuideStore.onCloseGuide();
    expect(GuideStore.state.currentGuide.id).toEqual(data.issue_stream.id);
    window.location.hash = '';
  });

  it('should record analytics events when guide is cued', function() {
    const spy = jest.spyOn(GuideStore, 'recordCue');
    GuideStore.onFetchSucceeded(data);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('should not send multiple cue analytics events for same guide', function() {
    const spy = jest.spyOn(GuideStore, 'recordCue');
    GuideStore.onFetchSucceeded(data);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(1);
    GuideStore.updateCurrentGuide();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  describe('discover sidebar guide', function() {
    beforeEach(function() {
      data = {
        discover_sidebar: {
          id: 4,
          seen: false,
        },
      };

      GuideStore.onRegisterAnchor(<GuideAnchor target="discover-sidebar" />);
    });

    it('does not render without user', function() {
      ConfigStore.config = {};
      GuideStore.onFetchSucceeded(data);
      expect(GuideStore.state.currentGuide).toBe(null);
    });

    it('shows discover sidebar guide to superusers', function() {
      ConfigStore.config = {
        user: {
          isSuperuser: true,
        },
      };
      GuideStore.onFetchSucceeded(data);
      expect(GuideStore.state.currentGuide.id).toBe(data.discover_sidebar.id);
    });

    it('shows discover sidebar guide to previously existing users', function() {
      ConfigStore.config = {
        user: {
          isSuperuser: false,
          dateJoined: new Date(2020, 0, 1),
        },
      };
      GuideStore.onFetchSucceeded(data);
      expect(GuideStore.state.currentGuide.id).toBe(data.discover_sidebar.id);
    });

    it('does not show discover sidebar guide to new users', function() {
      ConfigStore.config = {
        user: {
          isSuperuser: false,
          dateJoined: new Date(2020, 1, 22),
        },
      };
      GuideStore.onFetchSucceeded(data);
      expect(GuideStore.state.currentGuide).toBe(null);
    });

    it('hides discover sidebar guide once seen', function() {
      data.discover_sidebar.seen = true;
      // previous user
      ConfigStore.config = {
        user: {
          isSuperuser: false,
          dateJoined: new Date(2020, 0, 1),
        },
      };
      GuideStore.onFetchSucceeded(data);
      expect(GuideStore.state.currentGuide).toBe(null);
    });
  });
});
