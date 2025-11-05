export interface QuickBaseApp {
  id: string;
  name: string;
  description?: string;
  created: string;
  updated: string;
  tableCount?: number;
}

export interface QuickBaseTable {
  id: string;
  name: string;
  alias?: string;
  description?: string;
  created: string;
  updated: string;
  recordCount?: number;
  fields?: QuickBaseField[];
}

export interface QuickBaseField {
  id: number;
  label: string;
  fieldType: QuickBaseFieldType;
  required?: boolean;
  unique?: boolean;
  properties?: Record<string, any>;
  permissions?: FieldPermissions;
}

export type QuickBaseFieldType = 
  | 'text'
  | 'text-multi-line'
  | 'text-multiple-choice'
  | 'rich-text'
  | 'numeric'
  | 'currency'
  | 'percent'
  | 'rating'
  | 'date'
  | 'datetime'
  | 'time-of-day'
  | 'duration'
  | 'checkbox'
  | 'user'
  | 'multiuser'
  | 'file-attachment'
  | 'report-link'
  | 'email'
  | 'phone'
  | 'url'
  | 'address';

export interface FieldPermissions {
  read: boolean;
  write: boolean;
  modify: boolean;
}

export interface QuickBaseRecord {
  id: string;
  data: Record<string, any>;
  created?: string;
  updated?: string;
  author?: string;
  lastModifiedBy?: string;
}

export interface QuickBaseQuery {
  from: string;
  select?: number[];
  where?: string;
  sortBy?: SortBy[];
  groupBy?: GroupBy[];
  options?: QueryOptions;
}

export interface SortBy {
  fieldId: number;
  order: 'ASC' | 'DESC';
}

export interface GroupBy {
  fieldId: number;
  grouping: 'equal-values' | 'ranges' | 'date-grouping';
}

export interface QueryOptions {
  skip?: number;
  top?: number;
  compareWithAppLocalTime?: boolean;
}

export interface QuickBaseReport {
  id: string;
  name: string;
  description?: string;
  type: 'table' | 'summary' | 'chart';
  query: QuickBaseQuery;
}

export interface QuickBaseRelationship {
  id: string;
  parentTableId: string;
  childTableId: string;
  foreignKeyField: number;
  lookupFields?: number[];
  summaryFields?: SummaryField[];
}

export interface SummaryField {
  fieldId: number;
  summaryType: 'sum' | 'avg' | 'max' | 'min' | 'count';
  where?: string;
}

export interface FileAttachment {
  fileName: string;
  versions: FileVersion[];
}

export interface FileVersion {
  versionNumber: number;
  uploaded: string;
  creator: string;
  size: number;
  url: string;
}