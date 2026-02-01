import { useCallback, useState } from 'react';
import type {
  ExportProgressState,
  ExportProgressActions,
} from '../types/exportProgress';

/**
 * Hook for managing export progress state
 *
 * Tracks the progress of audio export operations, including
 * bulk exports with multiple items.
 */
export function useExportProgress(): ExportProgressState & ExportProgressActions {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const startExport = useCallback((total: number): void => {
    setIsExporting(true);
    setProgress(0);
    setCurrentItem(1);
    setTotalItems(total);
  }, []);

  const updateProgress = useCallback((current: number, progressPercent: number): void => {
    setCurrentItem(current);
    setProgress(progressPercent);
  }, []);

  const completeExport = useCallback((): void => {
    setIsExporting(false);
    setProgress(100);
    setCurrentItem(0);
    setTotalItems(0);
  }, []);

  return {
    isExporting,
    progress,
    currentItem,
    totalItems,
    startExport,
    updateProgress,
    completeExport,
  };
}
