type TrainingTitleIssue = {
  title: string;
  questions: Array<{
    works?: Array<{
      level?: string;
      title?: string;
    }>;
  }>;
};

export function getTrainingIssueTitle(issue: TrainingTitleIssue) {
  const firstHighLikeTitle = issue.questions
    .flatMap((question) => question.works ?? [])
    .find((work) => work.level === "高赞")
    ?.title
    ?.trim();

  return firstHighLikeTitle || issue.title;
}
