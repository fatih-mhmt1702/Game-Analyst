import { tr } from './tr';
import { en } from './en';

export function tTopic(topic: string, lang: 'tr' | 'en'): string {
  if (lang === 'tr') {
    return (tr.topics as Record<string, string>)[topic] || topic;
  }
  return topic;
}

export function tSentiment(sentiment: string, lang: 'tr' | 'en'): string {
  if (lang === 'tr') {
    return (tr.sentiments as Record<string, string>)[sentiment] || sentiment;
  }
  return sentiment;
}

export function tSeverity(severity: string, lang: 'tr' | 'en'): string {
  if (lang === 'tr') {
    return (tr.severities as Record<string, string>)[severity] || severity;
  }
  return severity;
}

export function tPriorityGroup(group: string, lang: 'tr' | 'en'): string {
  if (lang === 'tr') {
    return (tr.priority_groups as Record<string, string>)[group] || group;
  }
  return group;
}
