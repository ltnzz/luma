import type { TourStep } from './types'

/**
 * Single source of truth for the mandatory first-visit tour.
 * Copy lives in `i18n/dictionaries.ts` under the `tour.*` keys so the tour
 * follows the active language.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    selector: null,
    titleKey: 'tour.step1.title',
    bodyKey: 'tour.step1.body',
    placement: 'center',
  },
  {
    id: 'map',
    selector: '[data-tour="map-controls"]',
    titleKey: 'tour.step2.title',
    bodyKey: 'tour.step2.body',
    placement: 'left',
  },
  {
    id: 'region',
    selector: '[data-tour="region-selector"]',
    titleKey: 'tour.step3.title',
    bodyKey: 'tour.step3.body',
    placement: 'bottom',
  },
  {
    id: 'categories',
    selector: '[data-tour="facility-dock"]',
    titleKey: 'tour.step4.title',
    bodyKey: 'tour.step4.body',
    placement: 'top',
  },
  {
    id: 'details',
    selector: '[data-tour="map-canvas"]',
    titleKey: 'tour.step5.title',
    bodyKey: 'tour.step5.body',
    placement: 'center',
  },
  {
    id: 'environment',
    selector: '[data-tour="air-quality"]',
    titleKey: 'tour.step6.title',
    bodyKey: 'tour.step6.body',
    placement: 'right',
  },
  {
    id: 'data-sources',
    selector: '[data-tour="data-sources"]',
    titleKey: 'tour.step7.title',
    bodyKey: 'tour.step7.body',
    placement: 'right',
  },
] satisfies TourStep[] as TourStep[]
