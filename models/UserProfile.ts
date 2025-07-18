// UserProfile model for storing comprehensive user onboarding data
import mongoose, { Schema, Document } from 'mongoose';

// TypeScript interfaces for type safety
export interface OrgDirectoryEntry {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
}

export interface SocialProfiles {
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  other: string;
}

export interface Education {
  school: string;
  degree: string;
  year: number | null;
}

export interface GreekLife {
  org: string;
  chapter: string;
  role: string;
}

export interface Family {
  spouse: string;
  children: string[];
  siblings: string[];
}

export interface Hometown {
  city: string;
  state: string;
  country: string;
}

export interface OnboardingStatus {
  companyDirectoryImported: boolean;
  socialProfilesConnected: boolean;
  personalInfoCompleted: boolean;
  completedAt?: Date;
}

export interface IUserProfile extends Document {
  userId: string;
  oktaId: string;
  email: string;
  name: string;
  company: string;
  title?: string;
  orgDirectory: OrgDirectoryEntry[];
  socialProfiles: SocialProfiles;
  education: Education;
  greekLife: GreekLife;
  family: Family;
  hometowns: Hometown[];
  organizations: string[];
  onboardingStatus: OnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OrgDirectoryEntrySchema = new Schema<OrgDirectoryEntry>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  title: { type: String, required: true },
  department: { type: String, required: true }
});

const SocialProfilesSchema = new Schema<SocialProfiles>({
  linkedin: { type: String, default: '' },
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  other: { type: String, default: '' }
});

const EducationSchema = new Schema<Education>({
  school: { type: String, default: '' },
  degree: { type: String, default: '' },
  year: { type: Number, default: null }
});

const GreekLifeSchema = new Schema<GreekLife>({
  org: { type: String, default: '' },
  chapter: { type: String, default: '' },
  role: { type: String, default: '' }
});

const FamilySchema = new Schema<Family>({
  spouse: { type: String, default: '' },
  children: { type: [String], default: [] },
  siblings: { type: [String], default: [] }
});

const HometownSchema = new Schema<Hometown>({
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' }
});

const OnboardingStatusSchema = new Schema<OnboardingStatus>({
  companyDirectoryImported: { type: Boolean, default: false },
  socialProfilesConnected: { type: Boolean, default: false },
  personalInfoCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const UserProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  oktaId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  // Company directory from Okta People API
  orgDirectory: {
    type: [OrgDirectoryEntrySchema],
    default: []
  },
  // Enhanced social profiles with structured format
  socialProfiles: {
    type: SocialProfilesSchema,
    default: () => ({
      linkedin: '',
      facebook: '',
      twitter: '',
      instagram: '',
      other: ''
    })
  },
  // Structured education information
  education: {
    type: EducationSchema,
    default: () => ({
      school: '',
      degree: '',
      year: null
    })
  },
  // Greek life/fraternity information
  greekLife: {
    type: GreekLifeSchema,
    default: () => ({
      org: '',
      chapter: '',
      role: ''
    })
  },
  // Family member information
  family: {
    type: FamilySchema,
    default: () => ({
      spouse: '',
      children: [],
      siblings: []
    })
  },
  // Structured hometown information
  hometowns: {
    type: [HometownSchema],
    default: []
  },
  // Legacy fields for backward compatibility
  organizations: {
    type: [String],
    default: []
  },
  // Onboarding completion tracking
  onboardingStatus: {
    type: OnboardingStatusSchema,
    default: () => ({
      companyDirectoryImported: false,
      socialProfilesConnected: false,
      personalInfoCompleted: false
    })
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
UserProfileSchema.pre<IUserProfile>('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods for common operations
UserProfileSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

UserProfileSchema.statics.findByOktaId = function(oktaId: string) {
  return this.findOne({ oktaId });
};

UserProfileSchema.statics.findByCompany = function(company: string) {
  return this.find({ company });
};

UserProfileSchema.statics.findIncompleteOnboarding = function() {
  return this.find({
    $or: [
      { 'onboardingStatus.companyDirectoryImported': false },
      { 'onboardingStatus.socialProfilesConnected': false },
      { 'onboardingStatus.personalInfoCompleted': false }
    ]
  });
};

// Instance methods
UserProfileSchema.methods.markOnboardingComplete = function() {
  this.onboardingStatus.companyDirectoryImported = true;
  this.onboardingStatus.socialProfilesConnected = true;
  this.onboardingStatus.personalInfoCompleted = true;
  this.onboardingStatus.completedAt = new Date();
  return this.save();
};

UserProfileSchema.methods.updateSocialProfiles = function(profiles: Partial<SocialProfiles>) {
  Object.assign(this.socialProfiles, profiles);
  this.onboardingStatus.socialProfilesConnected = true;
  return this.save();
};

UserProfileSchema.methods.updateEducation = function(education: Partial<Education>) {
  Object.assign(this.education, education);
  return this.save();
};

UserProfileSchema.methods.addHometown = function(hometown: Hometown) {
  this.hometowns.push(hometown);
  return this.save();
};

UserProfileSchema.methods.updateFamily = function(family: Partial<Family>) {
  Object.assign(this.family, family);
  return this.save();
};

UserProfileSchema.methods.importOrgDirectory = function(directory: OrgDirectoryEntry[]) {
  this.orgDirectory = directory;
  this.onboardingStatus.companyDirectoryImported = true;
  return this.save();
};

UserProfileSchema.methods.getCompletionPercentage = function(): number {
  let completedSections = 0;
  const totalSections = 3;

  if (this.onboardingStatus.companyDirectoryImported) completedSections++;
  if (this.onboardingStatus.socialProfilesConnected) completedSections++;
  if (this.onboardingStatus.personalInfoCompleted) completedSections++;

  return Math.round((completedSections / totalSections) * 100);
};

// Indexes for performance
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ oktaId: 1 });
UserProfileSchema.index({ company: 1 });
UserProfileSchema.index({ email: 1 });
UserProfileSchema.index({ 'onboardingStatus.companyDirectoryImported': 1 });
UserProfileSchema.index({ 'onboardingStatus.socialProfilesConnected': 1 });
UserProfileSchema.index({ 'onboardingStatus.personalInfoCompleted': 1 });

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);