import { FEATURE_FLAGS, type FeatureFlag } from "@/config/features.config";

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
