import { createIssue } from './create';
import { getIssue } from './get';
import { listIssues } from './list';
import { updateIssue } from './update';

export const issueRoutes = {
  listIssues,
  createIssue,
  getIssue,
  updateIssue,
};
