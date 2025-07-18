const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');

// POST /api/onboarding/save - Save comprehensive onboarding data
router.post('/save', async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      title,
      bio,
      socialProfiles,
      education,
      greekLife,
      family,
      hometowns
    } = req.body;

    // Validate required fields
    if (!name || !email || !company) {
      return res.status(400).json({
        error: 'Name, email, and company are required fields'
      });
    }

    // Create or update user profile
    const userId = req.user?.id || email; // Use email as fallback if no user ID
    const oktaId = req.user?.sub || email; // Use email as fallback if no Okta ID

    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.name = name;
      profile.email = email;
      profile.company = company;
      profile.title = title || '';
      
      // Update enhanced fields
      profile.socialProfiles = {
        linkedin: socialProfiles?.linkedin || '',
        facebook: socialProfiles?.facebook || '',
        twitter: socialProfiles?.twitter || '',
        instagram: socialProfiles?.instagram || '',
        other: socialProfiles?.other || ''
      };

      profile.education = {
        school: education?.school || '',
        degree: education?.degree || '',
        year: education?.year || null
      };

      profile.greekLife = {
        org: greekLife?.org || '',
        chapter: greekLife?.chapter || '',
        role: greekLife?.role || ''
      };

      profile.family = {
        spouse: family?.spouse || '',
        children: family?.children?.filter(child => child.trim()) || [],
        siblings: family?.siblings?.filter(sibling => sibling.trim()) || []
      };

      profile.hometowns = hometowns?.filter(h => h.city || h.state || h.country) || [];

      // Update onboarding status
      profile.onboardingStatus.personalInfoCompleted = true;
      profile.onboardingStatus.completedAt = new Date();

    } else {
      // Create new profile
      profile = new UserProfile({
        userId,
        oktaId,
        name,
        email,
        company,
        title: title || '',
        socialProfiles: {
          linkedin: socialProfiles?.linkedin || '',
          facebook: socialProfiles?.facebook || '',
          twitter: socialProfiles?.twitter || '',
          instagram: socialProfiles?.instagram || '',
          other: socialProfiles?.other || ''
        },
        education: {
          school: education?.school || '',
          degree: education?.degree || '',
          year: education?.year || null
        },
        greekLife: {
          org: greekLife?.org || '',
          chapter: greekLife?.chapter || '',
          role: greekLife?.role || ''
        },
        family: {
          spouse: family?.spouse || '',
          children: family?.children?.filter(child => child.trim()) || [],
          siblings: family?.siblings?.filter(sibling => sibling.trim()) || []
        },
        hometowns: hometowns?.filter(h => h.city || h.state || h.country) || [],
        onboardingStatus: {
          companyDirectoryImported: false,
          socialProfilesConnected: false,
          personalInfoCompleted: true,
          completedAt: new Date()
        }
      });
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Profile saved successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        company: profile.company,
        title: profile.title,
        onboardingCompleted: profile.onboardingStatus.personalInfoCompleted
      }
    });

  } catch (error) {
    console.error('Onboarding save error:', error);
    res.status(500).json({
      error: 'Failed to save profile',
      details: error.message
    });
  }
});

// GET /api/onboarding/profile - Get user's profile data
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.email;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID or email required' });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: {
        name: profile.name,
        email: profile.email,
        company: profile.company,
        title: profile.title,
        socialProfiles: profile.socialProfiles,
        education: profile.education,
        greekLife: profile.greekLife,
        family: profile.family,
        hometowns: profile.hometowns,
        onboardingStatus: profile.onboardingStatus
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
});

module.exports = router;