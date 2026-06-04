import { FEATURE_FLAGS, type FeatureFlag } from "@/common/config";

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
