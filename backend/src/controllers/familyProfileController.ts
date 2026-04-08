import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FamilyProfile, IFamilyProfile } from '../models/FamilyProfile';

/**
 * Create a new family profile
 */
export const createFamilyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, dateOfBirth, gender, relation, mobileNumber, email } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validation
    if (!fullName || !dateOfBirth || !gender || !relation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const profile = await FamilyProfile.create({
      userId,
      fullName,
      dateOfBirth,
      gender,
      relation,
      mobileNumber,
      email,
    });

    return res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error creating family profile:', error);
    return res.status(500).json({ error: 'Failed to create family profile' });
  }
};

/**
 * Get all family profiles for a user
 */
export const getFamilyProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profiles = await FamilyProfile.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching family profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch family profiles' });
  }
};

/**
 * Get a single family profile by ID
 */
export const getFamilyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await FamilyProfile.findById(profileId);

    if (!profile || profile.userId !== userId) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching family profile:', error);
    return res.status(500).json({ error: 'Failed to fetch family profile' });
  }
};

/**
 * Update a family profile
 */
export const updateFamilyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await FamilyProfile.findById(profileId);

    if (!profile || profile.userId !== userId) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update allowed fields
    const allowedFields = ['fullName', 'gender', 'mobileNumber', 'email', 'address'];
    allowedFields.forEach(field => {
      if (field in updates) {
        profile[field as keyof IFamilyProfile] = updates[field];
      }
    });

    await profile.save();

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error updating family profile:', error);
    return res.status(500).json({ error: 'Failed to update family profile' });
  }
};

/**
 * Delete a family profile
 */
export const deleteFamilyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await FamilyProfile.findById(profileId);

    if (!profile || profile.userId !== userId) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await FamilyProfile.findByIdAndDelete(profileId);

    return res.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting family profile:', error);
    return res.status(500).json({ error: 'Failed to delete family profile' });
  }
};
