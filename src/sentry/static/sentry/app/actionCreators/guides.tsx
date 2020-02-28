import {Client} from 'app/api';
import GuideActions from 'app/actions/guideActions';
import {trackAnalyticsEvent} from 'app/utils/analytics';

const api = new Client();

export function fetchGuides() {
  api.request('/assistant/', {
    method: 'GET',
    success: data => {
      GuideActions.fetchSucceeded(data);
    },
  });
}

export function registerAnchor(target: string) {
  GuideActions.registerAnchor(target);
}

export function unregisterAnchor(target: string) {
  GuideActions.unregisterAnchor(target);
}

export function nextStep() {
  GuideActions.nextStep();
}

export function closeGuide() {
  GuideActions.closeGuide();
}

export function dismissGuide(guide: string, step: number, orgId: string) {
  recordDismiss(guide, step, orgId);
  closeGuide();
}

export function recordFinish(guide: string, orgId: string) {
  api.request('/assistant/', {
    method: 'PUT',
    data: {
      guide,
      status: 'viewed',
    },
  });
  const data = {
    eventKey: 'assistant.guide_finished',
    eventName: 'Assistant Guide Finished',
    guide,
    organization_id: orgId,
  };
  trackAnalyticsEvent(data);
}

export function recordDismiss(guide: string, step: number, orgId: string) {
  api.request('/assistant/', {
    method: 'PUT',
    data: {
      guide,
      status: 'dismissed',
    },
  });
  const data = {
    eventKey: 'assistant.guide_dismissed',
    eventName: 'Assistant Guide Dismissed',
    guide,
    step,
    organization_id: orgId,
  };
  trackAnalyticsEvent(data);
}
