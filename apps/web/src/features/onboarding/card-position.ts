import type { TourPlacement, TourRect } from './types'

export const GAP = 12
export const VIEWPORT_MARGIN = 12

export const TOUR_CARD_WIDTH = 'min(340px, calc(100vw - 1.5rem))'
export const TOUR_HERO_WIDTH = 'min(560px, calc(100vw - 1.5rem))'

export interface Position {
  left: number
  top: number
}

export interface ViewportSize {
  width: number
  height: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function overlaps(
  pos: Position,
  cardSize: { width: number; height: number },
  rect: TourRect,
): boolean {
  return !(
    pos.left + cardSize.width <= rect.left ||
    pos.left >= rect.left + rect.width ||
    pos.top + cardSize.height <= rect.top ||
    pos.top >= rect.top + rect.height
  )
}

/**
 * Computes the position for the Step 1 Welcome/Hero card.
 * - Mobile: perfectly centered horizontally and vertically with safe margins.
 * - Desktop: editorial opening panel anchored to the bottom edge.
 */
export function computeHeroPosition(
  cardSize: { width: number; height: number },
  viewport: ViewportSize,
  isMobile: boolean,
): Position {
  const safeLeft = VIEWPORT_MARGIN
  const safeRight = viewport.width - VIEWPORT_MARGIN
  const safeTop = VIEWPORT_MARGIN
  const safeBottom = viewport.height - VIEWPORT_MARGIN

  const effectiveCardWidth = Math.min(
    cardSize.width,
    Math.max(120, viewport.width - 2 * VIEWPORT_MARGIN),
  )
  const left = clamp(
    (viewport.width - effectiveCardWidth) / 2,
    safeLeft,
    Math.max(safeLeft, safeRight - effectiveCardWidth),
  )

  if (isMobile) {
    const top = clamp(
      (viewport.height - cardSize.height) / 2,
      safeTop,
      Math.max(safeTop, safeBottom - cardSize.height),
    )
    return { left, top }
  }

  return {
    left: Math.max(VIEWPORT_MARGIN, (viewport.width - cardSize.width) / 2),
    top: Math.max(VIEWPORT_MARGIN, viewport.height - cardSize.height - 28),
  }
}

/**
 * Picks a card position near the target rect without clipping or colliding with the spotlight.
 * Evaluates candidate placements with horizontal and vertical clamping so cards near screen
 * edges (such as mobile map-controls) do not overflow or overlap the spotlight target.
 */
export function computeCardPosition(
  rect: TourRect | null,
  cardSize: { width: number; height: number },
  placement: TourPlacement,
  viewport: ViewportSize,
): Position {
  const safeLeft = VIEWPORT_MARGIN
  const safeTop = VIEWPORT_MARGIN
  const safeRight = viewport.width - VIEWPORT_MARGIN
  const safeBottom = viewport.height - VIEWPORT_MARGIN

  const maxAvailableWidth = Math.max(0, safeRight - safeLeft)
  const effectiveCardWidth = Math.min(cardSize.width, maxAvailableWidth)

  if (!rect) {
    return {
      left: clamp(
        (viewport.width - effectiveCardWidth) / 2,
        safeLeft,
        Math.max(safeLeft, safeRight - effectiveCardWidth),
      ),
      top: clamp(
        (viewport.height - cardSize.height) / 2,
        safeTop,
        Math.max(safeTop, safeBottom - cardSize.height),
      ),
    }
  }

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const clampedX = clamp(
    centerX - effectiveCardWidth / 2,
    safeLeft,
    Math.max(safeLeft, safeRight - effectiveCardWidth),
  )
  const clampedY = clamp(
    centerY - cardSize.height / 2,
    safeTop,
    Math.max(safeTop, safeBottom - cardSize.height),
  )

  const candidates: Record<TourPlacement, Position> = {
    top: { left: clampedX, top: rect.top - GAP - cardSize.height },
    bottom: { left: clampedX, top: rect.top + rect.height + GAP },
    left: { left: rect.left - GAP - effectiveCardWidth, top: clampedY },
    right: { left: rect.left + rect.width + GAP, top: clampedY },
    center: { left: clampedX, top: clampedY },
  }

  const opposite: Record<TourPlacement, TourPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
    center: 'center',
  }

  const order: TourPlacement[] =
    placement === 'center'
      ? ['center']
      : [
          placement,
          opposite[placement],
          placement === 'top' || placement === 'bottom' ? 'left' : 'top',
          placement === 'top' || placement === 'bottom' ? 'right' : 'bottom',
        ]

  const fits = (position: Position) =>
    position.left >= safeLeft &&
    position.top >= safeTop &&
    position.left + effectiveCardWidth <= safeRight &&
    position.top + cardSize.height <= safeBottom &&
    !overlaps(position, { width: effectiveCardWidth, height: cardSize.height }, rect)

  for (const candidate of order) {
    const position = candidates[candidate]
    if (fits(position)) return position
  }

  // Fallback for very restricted viewports (small mobile screens / landscape):
  // Place card in the quadrant with largest available clearance so spotlight is not covered.
  const spaceAbove = rect.top - safeTop
  const spaceBelow = safeBottom - (rect.top + rect.height)
  const spaceLeft = rect.left - safeLeft
  const spaceRight = safeRight - (rect.left + rect.width)

  const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight)

  if (maxSpace === spaceAbove && spaceAbove > 0) {
    return {
      left: clampedX,
      top: Math.max(safeTop, rect.top - GAP - cardSize.height),
    }
  }

  if (maxSpace === spaceBelow && spaceBelow > 0) {
    return {
      left: clampedX,
      top: Math.min(safeBottom - cardSize.height, rect.top + rect.height + GAP),
    }
  }

  if (maxSpace === spaceLeft && spaceLeft > 0) {
    return {
      left: Math.max(safeLeft, rect.left - GAP - effectiveCardWidth),
      top: clampedY,
    }
  }

  if (maxSpace === spaceRight && spaceRight > 0) {
    return {
      left: Math.min(safeRight - effectiveCardWidth, rect.left + rect.width + GAP),
      top: clampedY,
    }
  }

  // Absolute fallback: clamp within margins
  return {
    left: clamp(
      candidates[placement].left,
      safeLeft,
      Math.max(safeLeft, safeRight - effectiveCardWidth),
    ),
    top: clamp(
      candidates[placement].top,
      safeTop,
      Math.max(safeTop, safeBottom - cardSize.height),
    ),
  }
}
