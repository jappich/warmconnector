// User profile management routes
const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const { simpleAuth } = require('./auth');

// Get user profile
router.get('/', simpleAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      // Return default profile structure if none exists
      return res.json({
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        company: req.user.company,
        onboardingStatus: {
          companyDirectoryImported: false,
          socialProfilesConnected: false,
          personalInfoCompleted: false
        },
        socialProfiles: [],
        education: [],
        organizations: [],
        family: [],
        hometowns: []
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update user profile
router.post('/', simpleAuth, async (req, res) => {
  try {
    const {
      name,
      company,
      title,
      socialProfiles,
      education,
      organizations,
      family,
      hometowns
    } = req.body;

    const profileData = {
      userId: req.user.id,
      oktaId: req.user.id, // Using user ID as Okta ID for development
      email: req.user.email,
      name: name || req.user.name,
      company: company || req.user.company,
      title,
      socialProfiles: socialProfiles || [],
      education: education || [],
      organizations: organizations || [],
      family: family || [],
      hometowns: hometowns || []
    };

    // Update onboarding status based on provided data
    const onboardingStatus = {
      companyDirectoryImported: false, // Will be set when directory is imported
      socialProfilesConnected: socialProfiles && socialProfiles.length > 0,
      personalInfoCompleted: !!(name && company && title)
    };

    if (onboardingStatus.personalInfoCompleted && onboardingStatus.socialProfilesConnected) {
      onboardingStatus.completedAt = new Date();
    }

    profileData.onboardingStatus = onboardingStatus;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { upsert: true, new: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete user profile
router.delete('/', simpleAuth, async (req, res) => {
  try {
    await UserProfile.findOneAndDelete({ userId: req.user.id });
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Profile deletion error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;