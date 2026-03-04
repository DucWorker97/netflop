import { SetMetadata } from '@nestjs/common';
import { POLICY_KEY, PolicyType, PolicyOptions } from '../guards/policy.guard';

/**
 * @CheckPolicy decorator - Attach BOLA policy to route handlers
 * 
 * Usage:
 * ```typescript
 * @CheckPolicy('MovieRead', { param: 'id' })
 * async getMovie(@Param('id') id: string) { ... }
 * 
 * @CheckPolicy('UserOwned')
 * async getMyFavorites() { ... }
 * 
 * @CheckPolicy('ProfileOwned', { param: 'id' })
 * async getProfile(@Param('id') id: string) { ... }
 * ```
 */
export const CheckPolicy = (type: PolicyType, options?: PolicyOptions) =>
    SetMetadata(POLICY_KEY, { type, options });

/**
 * Shorthand decorators for common policies
 */

/**
 * @MovieReadPolicy - Viewers see only published+ready, admins see all
 */
export const MovieReadPolicy = (param = 'id') =>
    CheckPolicy('MovieRead', { param });

/**
 * @MovieVisiblePolicy - Check movie is visible before operations (favorites, ratings, etc.)
 */
export const MovieVisiblePolicy = (param = 'movieId') =>
    CheckPolicy('MovieVisible', { param });

/**
 * @MovieWritePolicy - Admin only
 */
export const MovieWritePolicy = () =>
    CheckPolicy('MovieWrite');

/**
 * @UserOwnedPolicy - Current user owns the resource (validates x-profile-id header)
 */
export const UserOwnedPolicy = () =>
    CheckPolicy('UserOwned');

/**
 * @ProfileOwnedPolicy - Profile must belong to current user
 */
export const ProfileOwnedPolicy = (param = 'id') =>
    CheckPolicy('ProfileOwned', { param });
