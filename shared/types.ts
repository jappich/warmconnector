// Types for WarmConnector multi-relationship system

export interface UserProfile {
  oktaId: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  socialProfiles?: SocialProfile[];
  education?: Education[];
  family?: FamilyMember[];
  greekLife?: GreekLife;
  hometowns?: Hometown[];
  demo?: boolean;
  directory?: DirectoryEntry[];
}

export interface SocialProfile {
  provider: string;
  url: string;
  username?: string;
}

export interface Education {
  school: string;
  degree: string;
  year: number;
  fieldOfStudy?: string;
}

export interface FamilyMember {
  oktaId?: string;
  email?: string;
  relation: 'sibling' | 'spouse' | 'cousin' | 'parent' | 'child';
  name?: string;
}

export interface GreekLife {
  org: string;
  chapter: string;
  role: string;
  yearJoined?: number;
}

export interface Hometown {
  city: string;
  state: string;
  country: string;
}

export interface ConnectionData {
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface DirectoryEntry {
  oktaId: string;
  name: string;
  email: string;
}

export interface ConnectionPath {
  path: PathNode[];
  hops: number;
  totalStrength: number;
}

export interface PathNode {
  id: string;
  name: string;
  email: string;
  company?: string;
  relationshipType?: string;
  relationshipData?: any;
}

export interface IntroductionRequest {
  id: string;
  requesterId: string;
  connectorId: string;
  targetId: string;
  path: string[];
  message: string;
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType = 'COWORKER' | 'FAMILY' | 'SCHOOL' | 'FRAT' | 'HOMETOWN' | 'SOCIAL';