import {browserHistory} from 'react-router';
import Reflux from 'reflux';

import {Client} from 'app/api';
import {Guide} from 'app/components/assistant/types';
import {trackAnalyticsEvent} from 'app/utils/analytics';
import ConfigStore from 'app/stores/configStore';
import getGuidesContent from 'app/components/assistant/getGuidesContent';
import GuideActions from 'app/actions/guideActions';
import OrganizationsActions from 'app/actions/organizationsActions';

type State = {
  guides: Guide[];
  anchors: Set<string>;
  currentGuide: Guide | null;
  currentStep: number;
  orgId: string | null;
  forceShow: boolean;
  prevGuide: Guide | null;
};

const GuideStore = Reflux.createStore({
  init() {
    this.state = {
      /**
       * All tooltip guides
       */
      guides: [],
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
    } as State;

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

    const guidesContent = getGuidesContent();

    // Map server guide state (i.e. seen status) with guide content
    const guides = data.map(serverGuide => ({
      ...serverGuide,
      ...guidesContent.find(content => serverGuide.guide === content.guide),
    }));

    this.state.guides = guides;
    this.updateCurrentGuide();
  },

  onCloseGuide() {
    const {currentGuide} = this.state;
    this.state.guides.map(guide => {
      if (guide.guide === currentGuide.guide) {
        guide.seen = true;
      }
    });
    this.state.forceShow = false;
    this.updateCurrentGuide();
  },

  onNextStep() {
    this.state.currentStep += 1;
    this.trigger(this.state);
  },

  onRegisterAnchor(target: string) {
    this.state.anchors.add(target);
    this.updateCurrentGuide();
  },

  onUnregisterAnchor(target: string) {
    this.state.anchors.delete(target);
    this.updateCurrentGuide();
  },

  recordCue(guide) {
    const data = {
      guide,
      eventKey: 'assistant.guide_cued',
      eventName: 'Assistant Guide Cued',
      organization_id: this.state.orgId,
    };
    trackAnalyticsEvent(data);
  },

  updatePrevGuide(bestGuide) {
    const {prevGuide} = this.state;
    if (!bestGuide) {
      return;
    }

    if (!prevGuide || prevGuide.guide !== bestGuide.guide) {
      this.recordCue(bestGuide.guide);
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

    let guideOptions = guides
      .sort((a, b) => a.guide.localeCompare(b.guide))
      .filter(guide => guide.requiredTargets.every(target => anchors.has(target)));

    if (!forceShow) {
      const user = ConfigStore.get('user');
      const assistantThreshold = new Date(2019, 6, 1);
      const discoverDate = new Date(2020, 1, 6);
      const userDateJoined = new Date(user?.dateJoined);

      guideOptions = guideOptions.filter(({guide, seen}) => {
        if (seen) {
          return false;
        }
        if (user?.isSuperuser) {
          return true;
        }
        if (guide === 'discover_sidebar' && userDateJoined >= discoverDate) {
          return false;
        }
        return userDateJoined > assistantThreshold;
      });
    }

    const topGuide =
      guideOptions.length > 0
        ? {
            ...guideOptions[0],
            steps: guideOptions[0].steps.filter(
              step => step.target && anchors.has(step.target)
            ),
          }
        : null;

    this.updatePrevGuide(topGuide);
    this.state.currentGuide = topGuide;
    this.state.currentStep = 0;
    this.trigger(this.state);
  },
});

export default GuideStore;
