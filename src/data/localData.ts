import type {
  CurrentUser,
  DonationCenter,
  FoodItem,
  Game,
  Impact,
  Review,
  SurplusItem,
  Tailgate,
} from '../types';

import currentGameJson from './json/currentGame.json';
import currentUserJson from './json/currentUser.json';
import donationCentersJson from './json/donationCenters.json';
import impactJson from './json/impact.json';
import menuItemsJson from './json/menuItems.json';
import reviewsJson from './json/reviews.json';
import surplusItemsJson from './json/surplusItems.json';
import tailgatesJson from './json/tailgates.json';

export const currentGame = currentGameJson as Game;

export const tailgates = tailgatesJson as Tailgate[];

export const menuItems = menuItemsJson as FoodItem[];

export const surplusItems = surplusItemsJson as SurplusItem[];

export const reviews = reviewsJson as Review[];

export const impact = impactJson as Impact;

export const donationCenters = donationCentersJson as DonationCenter[];

export const currentUser = currentUserJson as CurrentUser;
