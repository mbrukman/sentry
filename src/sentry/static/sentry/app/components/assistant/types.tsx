export type GuideStep = {
  title: string;
  target: string;
  description: string | object;
};

export type GuideContent = {
  [key: string]: {
    required_targets: string[];
    steps: GuideStep[];
  };
};

export type Guide = {
  id: number;
  key?: string;
  required_targets: string[];
  steps: GuideStep[];
  seen: string;
};

export type Guides = {
  [key: string]: Guide;
};

export type GuideData = {
  [key: string]: {
    id: number;
    seen: boolean;
  };
};
