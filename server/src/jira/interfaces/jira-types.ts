/**
 * Jira API Type Definitions
 * Based on Jira Cloud REST API v3
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */

export interface JiraConfig {
  baseUrl: string; // e.g., https://yourname.atlassian.net
  email: string; // Your Atlassian account email
  apiToken: string; // API token from Atlassian account
  projectKey: string; // Project key (e.g., "KAN", "SUPPORT")
  isActive: boolean;
}

export interface JiraIssue {
  id: string;
  key: string; // e.g., "KAN-123"
  fields: {
    summary: string;
    description?: any; // Can be ADF (Atlassian Document Format) or string
    status: {
      id: string;
      name: string; // "Open", "In Progress", "Done", etc.
      statusCategory: {
        key: string;
      };
    };
    priority: {
      id: string;
      name: string; // "Highest", "High", "Medium", "Low", "Lowest"
    };
    issuetype: {
      id: string;
      name: string; // "Task", "Bug", "Story"
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
  };
}

export interface CreateJiraIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: {
      type: string;
      version: number;
      content: Array<{
        type: string;
        content?: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };
    issuetype: {
      name: string; // "Task", "Bug", "Story"
    };
    priority?: {
      name: string;
    };
    assignee?: {
      accountId: string;
    };
    labels?: string[]; // ← Add labels for tenant separation
  };
}

export interface CreateJiraIssueResponse {
  id: string;
  key: string; // "KAN-123"
  self: string;
}

export interface AddJiraCommentRequest {
  body: {
    type: string;
    version: number;
    content: Array<{
      type: string;
      content: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

// Priority mappings: Internal → Jira
export const PRIORITY_MAP: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Highest',
};

// Reverse mapping: Jira → Internal
export const JIRA_TO_INTERNAL_PRIORITY: Record<string, string> = {
  Lowest: 'LOW',
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Highest: 'URGENT',
};

// Status mappings: Internal → Jira
export const STATUS_MAP: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

// Reverse mapping: Jira → Internal
export const JIRA_TO_INTERNAL_STATUS: Record<string, string> = {
  Open: 'OPEN',
  'To Do': 'OPEN',
  'In Progress': 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Done: 'RESOLVED',
  Closed: 'CLOSED',
};
