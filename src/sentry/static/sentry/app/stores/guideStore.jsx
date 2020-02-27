import {browserHistory} from 'react-router';
import Reflux from 'reflux';
import * as Sentry from '@sentry/browser';

import {Client} from 'app/api';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import ConfigStore from 'app/stores/configStore';
import getGuideContent from 'app/components/assistant/getGuideContent';
import GuideActions from 'app/actions/guideActions';
import OrganizationsActions from 'app/actions/organizationsActions';

const GuideStore = Reflux.createStore({
  init() {
    this.state = {
      /**
       * All tooltip guides
       */
      guides: {},
      /**
       * Anchors that are currently mounted
       */
      anchors: new Set(),
      /**
       * The current guide
       */
      currentGuide: null,
      /**
       * Current step of the current guide
       */
      currentStep: 0,
      /**
       * Current organization id
       */
      orgId: null,
      /**
       * We force show a guide if the URL contains #assistant
       */
      forceShow: false,
      /**
       * The previously shown guide
       */
      prevGuide: null,
    };

    this.api = new Client();
    this.listenTo(GuideActions.fetchSucceeded, this.onFetchSucceeded);
    this.listenTo(GuideActions.closeGuide, this.onCloseGuide);
    this.listenTo(GuideActions.nextStep, this.onNextStep);
    this.listenTo(GuideActions.registerAnchor, this.onRegisterAnchor);
    this.listenTo(GuideActions.unregisterAnchor, this.onUnregisterAnchor);
    this.listenTo(OrganizationsActions.setActive, this.onSetActiveOrganization);

    window.addEventListener('load', this.onURLChange, false);
    browserHistory.listen(() => this.onURLChange());
  },

  onURLChange() {
    this.state.forceShow = window.location.hash === '#assistant';
    this.updateCurrentGuide();
  },

  onSetActiveOrganization(data) {
    this.state.orgId = data ? data.id : null;
    this.updateCurrentGuide();
  },

  onFetchSucceeded(data) {
    // It's possible we can get empty responses (seems to be Firefox specific)
    // Do nothing if `data` is empty
    if (!data) {
      return;
    }
    this.updateGuidesWithContent(data);
  },

  onCloseGuide() {
    const {currentGuide} = this.state;
    this.state.guides[currentGuide.key].seen = true;
    this.state.forceShow = false;
    this.updateCurrentGuide();
  },

  onNextStep() {
    this.state.currentStep += 1;
    this.trigger(this.state);
  },

  onRegisterAnchor(target) {
    this.state.anchors.add(target);
    this.updateCurrentGuide();
  },

  onUnregisterAnchor(target) {
    this.state.anchors.delete(target);
    this.updateCurrentGuide();
  },

  recordCue(id) {
    const data = {
      eventKey: 'assistant.guide_cued',
      eventName: 'Assistant Guide Cued',
      guide: id,
      organization_id: this.state.orgId,
    };
    trackAnalyticsEvent(data);
  },

  updateGuidesWithContent(data) {
    try {
      const content = getGuideContent();
      const guides = Object.keys(data).reduce((acc, key) => {
        if (key in content) {
          acc[key] = {...data[key], ...content[key]};
        }
        return acc;
      }, {});

      this.state.guides = guides;
      this.updateCurrentGuide();
    } catch (e) {
      Sentry.captureException(e);
    }
  },

  updatePrevGuide(bestGuide) {
    const {prevGuide} = this.state;
    if (!bestGuide) {
      return;
    }

    if (!prevGuide || prevGuide.id !== bestGuide.id) {
      this.recordCue(bestGuide.id);
      this.state.prevGuide = bestGuide;
    }
  },

  /**
   * Logic to determine if a guide is shown:
   *
   *  - If any required target is missing, don't show the guide
   *  - If the URL ends with #assistant, show the guide
   *  - If the user has already seen the guide, don't show the guide
   *  - Otherwise show the guide
   */
  updateCurrentGuide() {
    const {anchors, guides, forceShow} = this.state;

    let availableGuides = Object.keys(guides)
      .sort()
      .filter(key => guides[key].required_targets.every(target => anchors.has(target)));

    if (!forceShow) {
      const user = ConfigStore.get('user');
      const assistantThreshold = new Date(2019, 6, 1);
      const discoverDate = new Date(2020, 1, 6);
      const userDateJoined = new Date(user?.dateJoined);

      availableGuides = availableGuides.filter(key => {
        if (guides[key].seen) {
          return false;
        }
        if (user?.isSuperuser) {
          return true;
        }
        if (key === 'discover_sidebar' && userDateJoined >= discoverDate) {
          return false;
        }
        return userDateJoined > assistantThreshold;
      });
    }

    let bestGuide = null;
    if (availableGuides.length > 0) {
      const key = availableGuides[0];
      bestGuide = {
        key,
        ...guides[key],
        steps: guides[key].steps.filter(step => step.target && anchors.has(step.target)),
      };
    }

    this.updatePrevGuide(bestGuide);
    this.state.currentGuide = bestGuide;
    this.state.currentStep = 0;
    this.trigger(this.state);
  },
});

export default GuideStore;
