import { lazy } from 'react';
import type { ComponentType } from 'react';

export function createLazyComponent<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazy(importFunc);
}

export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<unknown> }>
) {
  void importFunc();
}
