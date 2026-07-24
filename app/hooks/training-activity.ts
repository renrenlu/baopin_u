"use client";

export const TRAINING_ACTIVITY_KEY = "baopin-hook-training-activity:v1";

export type TrainingActivity = Record<string, number>;

export function localDateKey(value: Date = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readTrainingActivity(): TrainingActivity {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(TRAINING_ACTIVITY_KEY) ?? "{}",
    ) as TrainingActivity;
    return Object.fromEntries(
      Object.entries(value).filter(
        ([date, count]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(count) && count > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function writeTrainingActivity(activity: TrainingActivity) {
  window.localStorage.setItem(TRAINING_ACTIVITY_KEY, JSON.stringify(activity));
}

export function recordTrainingAnswer() {
  const activity = readTrainingActivity();
  const today = localDateKey();
  activity[today] = (activity[today] ?? 0) + 1;
  writeTrainingActivity(activity);
  window.dispatchEvent(new Event("baopin-hook-progress"));
}
